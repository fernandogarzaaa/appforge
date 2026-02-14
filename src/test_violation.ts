const secret = 'sk_live_12345'; // SECURITY VIOLATION
function nested() { if(true) { if(true) { if(true) { console.log('nested'); } } } }