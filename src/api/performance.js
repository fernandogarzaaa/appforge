export async function fetchData() {
    const start = performance.now();
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    const end = performance.now();
    const latency = end - start;
    console.log(`API latency: ${latency}ms`);
    return data;
}

export function optimizeResponse(data) {
    return data.filter(item => item.active);
}

export async function getPerformanceOptimizedData() {
    const rawData = await fetchData();
    return optimizeResponse(rawData);
}