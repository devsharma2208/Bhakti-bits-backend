import app from "./app.js";
import { PORT } from "./config/env.js";

app.listen(PORT || 4000, () => {
    console.log(`Playlist server running on http://localhost:${PORT}`);
});
