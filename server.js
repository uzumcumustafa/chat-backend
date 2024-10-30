const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        // OpenAI thread oluştur
        const thread = await openai.beta.threads.create();
        
        // Mesajı threade ekle
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: message
        });

        // Run başlat
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: "asst_TWBykBcINZcvfdkFn0qo6fcn"
        });

        // Run tamamlanana kadar bekle
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        
        while (runStatus.status !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }

        // Mesajları al
        const messages = await openai.beta.threads.messages.list(thread.id);
        const assistantMessage = messages.data[0].content[0].text.value;

        res.json({ response: assistantMessage });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});