import json
import openai
import time
from tqdm import tqdm
import os
import random

# Initialize OpenAI client
client = openai.OpenAI(api_key="api-key") 

# Load the JSON file
with open('ad/advertising_archives_with_github_urls.json', 'r') as f:
    data = json.load(f)

# Define the prompt
prompt = """First, visually describe this perfume advertisement in 1–2 sentences. Then answer:
How many people are visible? (0, 1, 2, 3+)
For each person:
Gender? (man, woman, unclear)
Facial expression? (e.g., smiling, serious, seductive, neutral, hidden face, etc.)
Pose or action? (e.g., standing, reclining, hugging, touching perfume bottle, etc.)
Emotion tags (5 words)
Is nudity present? (no, partial, yes)
Is the image sexually suggestive? (neutral, suggestive, intimate)
What type of interaction is shown? (none, alone, romantic, group, etc.)
mood tags (5 words)

Respond in this JSON format:
{
  "vision": {
    "description": "",
    "people": [
      {
        "gender": "",
        "facial_expression": "",
        "pose_action": "",
        "emotion_tags": []
      }
    ],
    "people_count": 0,
    "nudity": "",
    "sexual_suggestiveness": "",
    "interaction_type": "",
    "mood_tags": []
  }
}"""

# Batch processing parameters
BATCH_SIZE = 5  # 5 items per batch
MAX_RETRIES = 3  # Maximum number of retries for rate limit errors

# Create output directory if it doesn't exist
os.makedirs('batch_results', exist_ok=True)

# Load existing results to avoid reprocessing
all_results = []
if os.path.exists('perfume_ad_analysis_all_results.json'):
    try:
        with open('perfume_ad_analysis_all_results.json', 'r') as f:
            all_results = json.load(f)
        print(f"Loaded {len(all_results)} existing results")
    except:
        print("Could not load existing results file, starting fresh")

# Create a function to generate a unique ID for each item
def get_unique_id(item):
    name = item.get('name', '')
    year = item.get('year', '')
    url = item.get('public_url', '')
    filename = url.split('/')[-1] if url else ''
    return f"{name}_{year}_{filename}"

# Create a set of already processed unique IDs for quick lookup
processed_ids = {get_unique_id(item) for item in all_results}
print(f"Found {len(processed_ids)} already processed unique IDs")

# Create a list of unprocessed items
unprocessed_items = []
for item in data:
    unique_id = get_unique_id(item)
    if unique_id not in processed_ids and "public_url" in item and item["public_url"]:
        unprocessed_items.append(item)

print(f"Found {len(unprocessed_items)} items that still need processing")

# Recalculate total number of batches based on unprocessed items
total_batches = (len(unprocessed_items) + BATCH_SIZE - 1) // BATCH_SIZE
print(f"Will process in {total_batches} batches of up to {BATCH_SIZE} items each")

# Function to handle API call with retries for rate limiting
def call_openai_api_with_retry(item, max_retries=MAX_RETRIES):
    retry_count = 0
    base_wait_time = 25
    
    while retry_count < max_retries:
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": item["public_url"]
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            return response
        except openai.RateLimitError as e:
            retry_count += 1
            if retry_count >= max_retries:
                raise
            
            # Extract wait time from error message if possible
            wait_time = base_wait_time
            error_msg = str(e)
            if "Please try again in" in error_msg and "s" in error_msg:
                try:
                    wait_str = error_msg.split("Please try again in")[1].split("s")[0].strip()
                    wait_time = int(wait_str) + 5  # Add 5-second buffer
                except:
                    # If parsing fails, use exponential backoff
                    wait_time = base_wait_time * (2 ** retry_count) + random.uniform(1, 5)
            
            print(f"Rate limit reached. Waiting {wait_time} seconds before retry {retry_count}/{max_retries}...")
            time.sleep(wait_time)
        except Exception as e:
            # For other errors like timeout, retry with increasing backoff
            retry_count += 1
            if retry_count >= max_retries:
                raise
            
            wait_time = base_wait_time * (2 ** retry_count) + random.uniform(1, 5)
            print(f"Error: {str(e)}. Waiting {wait_time} seconds before retry {retry_count}/{max_retries}...")
            time.sleep(wait_time)
    
    # If we get here, we've exceeded max retries
    raise Exception(f"Failed after {max_retries} retries")

# Function to process a batch
def process_batch(batch_items, batch_number):
    results = []
    
    print(f"Processing batch {batch_number + 1}/{total_batches} ({len(batch_items)} items)")
    
    for item in tqdm(batch_items):
        try:
            # Check for invalid URLs ending with a period (which seems to cause timeout issues)
            if item["public_url"].endswith('.'):
                fixed_url = item["public_url"][:-1]  # Remove the trailing period
                print(f"Fixing URL with trailing period: {item['public_url']} -> {fixed_url}")
                item["public_url"] = fixed_url
                
            # Call the Vision API with retry logic
            response = call_openai_api_with_retry(item)
            
            # Extract the response content
            result_text = response.choices[0].message.content
            
            # Try to parse the JSON from the response
            try:
                # Look for JSON in the response
                start_idx = result_text.find('{')
                end_idx = result_text.rfind('}') + 1
                
                if start_idx >= 0 and end_idx > start_idx:
                    json_str = result_text[start_idx:end_idx]
                    vision_result = json.loads(json_str)
                    
                    # Add the vision results to the original item
                    item_with_analysis = item.copy()
                    item_with_analysis["analysis"] = vision_result
                    item_with_analysis["unique_id"] = get_unique_id(item)  # Store the unique ID
                    results.append(item_with_analysis)
                else:
                    print(f"Couldn't find JSON in response for {item.get('name', 'unnamed')}")
                    print(f"Response: {result_text[:100]}...")
                    
            except json.JSONDecodeError:
                print(f"Failed to parse JSON for {item.get('name', 'unnamed')}")
                print(f"Response: {result_text[:100]}...")
                
            # Add a shorter delay between individual requests
            wait_time = random.randint(20, 25)  # Random wait between 20-25 seconds
            print(f"Waiting {wait_time} seconds before next request...")
            time.sleep(wait_time)
            
        except Exception as e:
            print(f"Error processing {item.get('name', 'unnamed')}: {str(e)}")
    
    return results

# Process the batches
for i in range(total_batches):
    # Calculate batch indices
    start_idx = i * BATCH_SIZE
    end_idx = min(start_idx + BATCH_SIZE, len(unprocessed_items))
    
    # Get current batch
    current_batch = unprocessed_items[start_idx:end_idx]
    
    # Process the batch
    batch_results = process_batch(current_batch, i)
    all_results.extend(batch_results)
    
    # Save intermediate results after each batch
    batch_name = f'batch_unprocessed_{i+1}'
    with open(f'batch_results/{batch_name}.json', 'w') as f:
        json.dump(batch_results, f, indent=2)
    
    # Save all results so far
    with open('perfume_ad_analysis_all_results.json', 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"Completed batch {i+1}/{total_batches}. Saved {len(batch_results)} results.")
    print(f"Total processed so far: {len(all_results)}/{len(data)}")
    
    # Add a shorter delay between batches
    if i < total_batches - 1:
        batch_wait = random.randint(30, 45)
        print(f"Waiting {batch_wait} seconds before next batch...")
        time.sleep(batch_wait)

print(f"Analysis completed for {len(all_results)} items out of {len(data)}")