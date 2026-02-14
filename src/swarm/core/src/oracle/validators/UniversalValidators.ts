export interface Validator {
    validate(code: string): Promise<{ valid: boolean; errors: string[] }>;
}

export class TypeScriptValidator implements Validator {
    async validate(code: string): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];
        // Simulation: Check for dangerous eval or innerHTML usage
        if (code.includes('eval(')) errors.push('Dangerous usage of eval() detected.');
        if (code.includes('dangerouslySetInnerHTML')) errors.push('Unsafe HTML injection detected.');

        return { valid: errors.length === 0, errors };
    }
}

export class RustValidator implements Validator {
    async validate(code: string): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];
        // Simulation: Check for unsafe blocks without justification
        if (code.includes('unsafe {') && !code.includes('// SAFETY:')) {
            errors.push('Unsafe block found without safety documentation.');
        }
        return { valid: errors.length === 0, errors };
    }
}

export class SolidityValidator implements Validator {
    async validate(code: string): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];
        // Simulation: Check for reentrancy vulnerability
        if (code.includes('call.value') && !code.includes('nonReentrant')) {
            errors.push('Potential reentrancy vulnerability: .call.value used without guard.');
        }
        return { valid: errors.length === 0, errors };
    }
}

export class ValidatorFactory {
    static getValidator(language: string): Validator {
        switch (language.toLowerCase()) {
            case 'typescript': return new TypeScriptValidator();
            case 'rust': return new RustValidator();
            case 'solidity': return new SolidityValidator();
            default: return new TypeScriptValidator(); // Default safe fallback
        }
    }
}
