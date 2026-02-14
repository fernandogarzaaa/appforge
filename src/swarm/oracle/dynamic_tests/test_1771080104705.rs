
pub fn check_violation(code: &str) -> i32 {
    fn check_violation(code: &str) -> i32 {
    if code.contains("fs.readFileSync") && code.contains("src/components/Violator.tsx") {
        1
    } else {
        0
    }
}
}
    