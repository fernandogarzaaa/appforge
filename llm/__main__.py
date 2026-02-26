from .chimera_server import app

if __name__ == "__main__":
    import uvicorn
    from .config import get_config
    config = get_config()
    uvicorn.run(app, host=config.HOST, port=config.PORT, log_level="info")
