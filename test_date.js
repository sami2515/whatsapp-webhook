const d = new Date(undefined);
console.log(d);
try {
    console.log(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
} catch (e) {
    console.log("ERROR:", e.message);
}
