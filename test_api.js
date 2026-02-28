import https from 'https';

https.get('https://whatsapp-webhook-awel.onrender.com/api/whatsapp/messages/923182402515', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const messages = JSON.parse(data);
        console.log(`Loaded ${messages.length} messages.`);
        let errorCount = 0;
        messages.forEach((msg, index) => {
            try {
                // simulate React logic
                const isSentByMe = msg.from !== '923182402515';
                if (msg.type === 'audio') {
                    const m = msg.mediaId;
                } else if (msg.type === 'image') {
                    const m = msg.mediaId;
                    const t = msg.text && msg.text !== '📸 Photo';
                } else {
                    const t = msg.text;
                }

                // simulate time formatting
                if (!msg.timestamp) {
                    console.log("Missing timestamp on msg index", index);
                }

            } catch (err) {
                console.error(`Error on message ${index}:`, msg, err);
                errorCount++;
            }
        });
        console.log(`Validation complete. Errors: ${errorCount}`);
    });
}).on('error', err => console.error(err));
