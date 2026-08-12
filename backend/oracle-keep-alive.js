const os = require('os');
const { Worker, isMainThread } = require('worker_threads');

// Target CPU utilization per core (e.g., 0.25 means 25% of the CPU core)
const targetCpuUsage = 0.25; 
const intervalMs = 100; 

function burnCPU() {
    const activeTime = intervalMs * targetCpuUsage;
    setInterval(() => {
        const start = Date.now();
        // Keep CPU busy for 'activeTime' milliseconds
        while (Date.now() - start < activeTime) {
            // Meaningless math to keep CPU busy
            Math.sqrt(Math.random() * Math.random());
        }
    }, intervalMs);
}

if (isMainThread) {
    const cores = os.cpus().length;
    console.log(`Starting Oracle Keep-Alive script...`);
    console.log(`Detected ${cores} CPU cores.`);
    console.log(`Spawning workers to maintain ~${targetCpuUsage * 100}% overall CPU usage...`);

    // Spawn a worker for each core to ensure total CPU utilization hits 25%
    for (let i = 0; i < cores; i++) {
        new Worker(__filename);
    }
    
    // Allocate ~500MB of RAM. Oracle A1 instances also look at Memory Idle.
    // Keeping a chunk of memory allocated helps avoid the idle criteria.
    const memoryHog = [];
    try {
        for(let i = 0; i < 10; i++) {
            // Allocate 50MB per chunk
            memoryHog.push(Buffer.alloc(50 * 1024 * 1024, 'a')); 
        }
        console.log("Allocated ~500MB of RAM to prevent memory idle.");
    } catch(e) {
        console.log("Memory allocation limited.");
    }
    
    console.log("Keep-alive is now running in the background.");
} else {
    // In worker thread: burn CPU
    burnCPU();
}
