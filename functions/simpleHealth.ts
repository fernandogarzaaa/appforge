
Deno.serve(async (req) => {
    return Response.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        message: 'Base44 environment is verified working',
        env: Deno.env.toObject() // Return env vars to debug if they are missing
    });
});
