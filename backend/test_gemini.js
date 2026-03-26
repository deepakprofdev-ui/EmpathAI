async function run() {
    try {
        const genAI = new (require('@google/generative-ai')).GoogleGenerativeAI('AIzaSyCfggsK_5f6aiyYPRbTbNTZ7kHduKTS_kE');
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello?");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.log("Status:", e.status, e.statusText);
        console.log(e.message);
    }
}
run();
