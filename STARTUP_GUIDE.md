# How to Start the Application

If you ever need to start this application manually, follow these **3 simple steps**. 

You will need to open your terminal and navigate to this project folder (`cd /Users/raacoon/Desktop/Project/invitation2`).

### Step 1: Start the Database (MongoDB)
The application relies on MongoDB. To start it, run this command:
```bash
brew services start mongodb-community
```
*(Note: If MongoDB is already running, this is safe to run again. Usually, you only need to run this once when you start your Mac).*

### Step 2: Start the Backend Server
Open a terminal in the project folder and run:
```bash
npm run server
```
*Wait until you see the message `MongoDB Connected: 127.0.0.1`. Leave this terminal open.*

### Step 3: Start the Frontend Application
Open a **new** terminal window (keep the backend one running), navigate to the project folder, and run:
```bash
npm run dev
```
*This will start the local website. You can now open [http://localhost:5173](http://localhost:5173) in your browser.*

---

**Troubleshooting:**
- **"Cannot connect to MongoDB"**: Make sure you ran Step 1 and wait a few seconds before starting the server.
- **Port already in use**: If it says port 3000 or 5173 is in use, you might have another terminal hiding somewhere running the app. You can stop it by closing that terminal or running `pkill -f node`.
