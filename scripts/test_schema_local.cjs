const fs = require('fs');
const json5 = require('json5');
const z = require('zod');

// --- Reconstructed Schemas from Base44 CLI 0.0.32 ---

const PropertyTypeSchema = z.enum([
    "string",
    "number",
    "integer",
    "boolean",
    "array",
    "object"
]);

const StringFormatSchema = z.enum([
    "date",
    "date-time",
    "time",
    "email",
    "uri",
    "hostname",
    "ipv4",
    "ipv6",
    "uuid"
]);

const PropertyDefinitionSchema = z.object({
    type: PropertyTypeSchema,
    title: z.string().optional(),
    description: z.string().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
    pattern: z.string().optional(),
    format: StringFormatSchema.optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    enum: z.array(z.string()).optional(),
    enumNames: z.array(z.string()).optional(),
    default: z.unknown().optional(),
    // $ref is skipped for simplicity or could be added
    required: z.array(z.string()).optional(),
    // Recursive properties manually handled if needed, but for now we skip complex recursion
    properties: z.any().optional()
});

const EntitySchema = z.object({
    type: z.literal("object"),
    name: z.string().regex(/^[a-zA-Z0-9]+$/, "Entity name must be alphanumeric only"),
    title: z.string().optional(),
    description: z.string().optional(),
    properties: z.record(z.string(), PropertyDefinitionSchema),
    required: z.array(z.string()).optional()
    // rls skipped
});

// --- Validation Logic ---

try {
    const content = fs.readFileSync('base44/entities/task.jsonc', 'utf8');
    const parsed = json5.parse(content);
    console.log('Parsed JSON5:', parsed);

    const result = EntitySchema.safeParse(parsed);
    if (!result.success) {
        console.error('Validation FAILED:');
        console.error(JSON.stringify(result.error.format(), null, 2));
    } else {
        console.log('Validation SUCCEEDED!');
    }

} catch (e) {
    console.error('Error:', e);
}
