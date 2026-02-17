export const getPerformanceData = async (req, res) => {
  try {
    const startTime = Date.now();

    // Simulate fetching data from a database or a third-party API
    const data = await fetchDataFromSource();

    const endTime = Date.now();
    const latency = endTime - startTime;

    console.log(`API latency: ${latency}ms`);

    if (latency > 200) {
      console.warn(`High latency detected: ${latency}ms`);
      // Optimize fetching or processing logic here
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const fetchDataFromSource = async () => {
  // Optimize this function to reduce latency
  return await new Promise((resolve) => {
    setTimeout(() => resolve({ message: 'Data fetched successfully!' }), 50);
  });
};