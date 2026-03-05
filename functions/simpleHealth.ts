
Deno.serve(async (req) => {
    return Response.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        message: 'Base44 environment is verified working'
    });
});
