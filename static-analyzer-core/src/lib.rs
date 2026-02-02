use once_cell::sync::Lazy;
use regex::Regex;
use serde::Serialize;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

#[derive(Debug, Serialize)]
struct Position {
    line: u32,
    column: u32,
}

#[derive(Debug, Serialize)]
struct Issue {
    path: String,
    rule: String,
    severity: String,
    message: String,
    start: Position,
    end: Position,
    snippet: String,
}

static SECRET_KEYWORD_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(api[_-]?key|secret|token|private[_-]?key|access[_-]?key|password)").unwrap()
});

static HIGH_ENTROPY_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"[A-Za-z0-9+/=_-]{32,}").unwrap()
});

static RSA_HEADER_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"-----BEGIN[ A-Z]*PRIVATE KEY-----").unwrap()
});

static SQL_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)\b(select|update|delete|insert|drop|alter)\b").unwrap()
});

static TEMPLATE_INTERP_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\$\{[^}]+\}").unwrap()
});

static CONCAT_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r#"['"]\s*\+\s*[A-Za-z_][A-Za-z0-9_]*"#).unwrap()
});

static EXEC_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(child_process\.|spawn|execSync|execFile)").unwrap()
});

#[wasm_bindgen]
pub fn analyze_source(path: &str, source: &str) -> JsValue {
    let issues = analyze(path, source);
    to_value(&issues).unwrap_or_else(|_| JsValue::NULL)
}

fn analyze(path: &str, source: &str) -> Vec<Issue> {
    let mut issues = Vec::new();
    for (idx, line) in source.lines().enumerate() {
        let line_no = idx as u32 + 1;

        if let Some(issue) = detect_secret(path, line, line_no) {
            issues.push(issue);
        }

        if let Some(issue) = detect_sql_injection(path, line, line_no) {
            issues.push(issue);
        }

        if let Some(issue) = detect_command_injection(path, line, line_no) {
            issues.push(issue);
        }
    }
    issues
}

fn detect_secret(path: &str, line: &str, line_no: u32) -> Option<Issue> {
    if RSA_HEADER_RE.is_match(line) {
        return Some(build_issue(
            path,
            "secret.rsa_key",
            "error",
            "Potential private key material detected",
            line_no,
            line,
            1,
            line.len() as u32,
        ));
    }

    if SECRET_KEYWORD_RE.is_match(line) && HIGH_ENTROPY_RE.is_match(line) {
        let (start, end) = match SECRET_KEYWORD_RE.find(line) {
            Some(m) => (m.start() as u32 + 1, (m.end() as u32).max(m.start() as u32 + 2)),
            None => (1, line.len() as u32),
        };
        return Some(build_issue(
            path,
            "secret.high_entropy",
            "error",
            "High-entropy value next to secret-like key",
            line_no,
            line,
            start,
            end,
        ));
    }

    None
}

fn detect_sql_injection(path: &str, line: &str, line_no: u32) -> Option<Issue> {
    if SQL_RE.is_match(line) && (TEMPLATE_INTERP_RE.is_match(line) || CONCAT_RE.is_match(line)) {
        let (start, end) = match SQL_RE.find(line) {
            Some(m) => (m.start() as u32 + 1, m.end() as u32),
            None => (1, line.len() as u32),
        };
        return Some(build_issue(
            path,
            "sql.concat",
            "warn",
            "SQL statement assembled with string interpolation/concat; sanitize inputs",
            line_no,
            line,
            start,
            end,
        ));
    }
    None
}

fn detect_command_injection(path: &str, line: &str, line_no: u32) -> Option<Issue> {
    if EXEC_RE.is_match(line) && (TEMPLATE_INTERP_RE.is_match(line) || CONCAT_RE.is_match(line)) {
        let (start, end) = match EXEC_RE.find(line) {
            Some(m) => (m.start() as u32 + 1, m.end() as u32),
            None => (1, line.len() as u32),
        };
        return Some(build_issue(
            path,
            "exec.concat",
            "warn",
            "Command execution with interpolated input; validate or escape arguments",
            line_no,
            line,
            start,
            end,
        ));
    }
    None
}

fn build_issue(
    path: &str,
    rule: &str,
    severity: &str,
    message: &str,
    line_no: u32,
    line: &str,
    start_col: u32,
    end_col: u32,
) -> Issue {
    Issue {
        path: path.to_string(),
        rule: rule.to_string(),
        severity: severity.to_string(),
        message: message.to_string(),
        start: Position {
            line: line_no,
            column: start_col,
        },
        end: Position {
            line: line_no,
            column: end_col,
        },
        snippet: line.trim().to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_high_entropy_secret() {
        let issues = analyze(
            "app.rs",
            "const API_KEY = 'sk_test_1234567890abcdefghijklmnopqrstuvwxyzABCDEF';",
        );
        assert!(issues.iter().any(|i| i.rule == "secret.high_entropy"));
    }

    #[test]
    fn detects_sql_concat() {
        let issues = analyze(
            "db.js",
            "const query = `SELECT * FROM users WHERE id = ${userId}`;",
        );
        assert!(issues.iter().any(|i| i.rule == "sql.concat"));
    }

    #[test]
    fn detects_exec_concat() {
        let issues = analyze(
            "exec.js",
            "child_process.exec(`rm -rf ${target}`);",
        );
        assert!(issues.iter().any(|i| i.rule == "exec.concat"));
    }
}
