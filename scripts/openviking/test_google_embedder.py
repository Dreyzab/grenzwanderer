
import sys
import os

# Add site-packages to path just in case
sys.path.append(r"f:\proje\grenzwanderer\Grenzwanderer\scripts\openviking\.venv\Lib\site-packages")

try:
    from openviking.models.embedder.google_embedders import GoogleDenseEmbedder
    print("Import successful")
    
    # We need a token to initialize, even if we don't call the API
    # But let's just test the instantiation
    embedder = GoogleDenseEmbedder(
        model_name="gemini-embedding-2-preview",
        api_key="dummy_token_for_init_test"
    )
    print(f"Embedder initialized: {embedder.model_name}")
    print(f"Base URL: {embedder.api_base}")
    print(f"Target URL: {embedder._get_url(embedder.model_name)}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
