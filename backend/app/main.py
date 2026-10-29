from fastapi import FastAPI

VERSION = "0.1.0"

app = FastAPI(title="Dumriya API", version=VERSION)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": VERSION}
