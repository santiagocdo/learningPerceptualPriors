# learningPerceptualPriors
How to run the offline stimulus generator in Windows The stimulus generator code runs offline and headlessly in Node.js. For that, the dependencies need to be installed (node, canvas, ffmpeg) and the script can be ran from the Command Prompt (not the Terminal)

1. Download node.js from https://nodejs.org/en
2. Add node.js to PATH by pressing Windows + R, then type: sysdm.cpl
3. Go to Advanced tab → click Environment Variables.
4. Under System variables, find and select Path, click Edit.
5. Click New, and paste the Node.js path (e.g. C:\Program Files\nodejs).
6. Click OK on all windows to save.
7. Open Command Prompt and check if node is installed e.g. by typing node -v or npm -v
8. Navigate to project folder and install dependencies with npm install (this should create a folder called node_modules)
9. Type npm install canvas, then npm install json2csv to install dependencies
10. Download ffmpeg from the release builds https://www.gyan.dev/ffmpeg/builds/ and add the \bin folder to the PATH (like in step 2-6)
11. run the code from the Command Prompt with node generate.js
