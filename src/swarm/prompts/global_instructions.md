Here are the rewritten instructions:

**Environment Variable Setup**

To set up the environment variable for your OpenAI API key, follow these steps:

1. **Windows**: Right-click on "Computer" or "This PC", select "Properties", then click on "Advanced system settings". In the System Properties window, click on the "Environment Variables" button and under "System Variables", click "New". Enter `OPENAI_API_KEY` as the variable name, followed by your OpenAI API key.
2. **macOS/Linux**: Open Terminal and run the command: `export OPENAI_API_KEY="your_api_key_here"` (replace with your actual API key).

**Verify Environment Variable Setting**

To confirm that the environment variable is set correctly:

* **Windows**: Run the command: `set OPENAI_API_KEY`
* **macOS/Linux**: Run the command: `echo $OPENAI_API_KEY`

By following these steps, you'll ensure that your OpenAI API key is securely stored as an environment variable, preventing errors like the one detected.