# Legend Lore Module for Foundry VTT
![badge_version] ![badge_issues] ![badge_downloads]
![badge_fvtt_versions]

[<img src="https://img.shields.io/badge/Support%20My%20Work-Buy%20me%20a%20coffee%20%E2%98%95-chocolate?style=plastic">](https://www.buymeacoffee.com/daxiongmao87)

![Screenshot](https://github.com/Daxiongmao87/legend-lore-foundry/blob/main/images/screenshot_dialog.png)

## Introduction

**Legend Lore** is an innovative module for Foundry Virtual Tabletop that leverages the power of Large Language Models to enhance storytelling and world-building in tabletop RPGs. It allows game masters to generate rich, AI-assisted text content, such as detailed journal entries, descriptions, and narrative elements, directly within Foundry VTT.


## Key Features

 * **AI-Powered Content Generation:** Seamlessly integrate powerful language models to enrich your game sessions.
 * **Dynamic Generation of Highlighted Text:** Highlight to generate any text from existing content within the editor.
 * **Customizable Settings:** Configure AI models, payload JSON templates, generation tries, reasoning tag filtering, etc.
 * **Built-in & User Templates:** Template choices are populated by the journal compendiums selected within the module's settings, with the default _Journal Entry Templates Compendium_ containing many templates to get you started.
 * **Complete Control Over JSON Payload** A customizable JSON payload template allows you to control the structure of the data sent to the AI model, making it flexible with most APIs.  This means the ability to use local or paid AI services.

### List of Included Templates
* Continent
* World
* Character
* Settlement
* Scenario
* Item
* Region
* Domain
* Point of Interest
* Faction
* Lore
* Culture
* Religion
* Miscellaneous

## Screenshots

### Generation Dialog

![Screenshot](https://github.com/Daxiongmao87/legend-lore-foundry/blob/main/images/screenshot_dialog.png)

### 'Generate Page' Element

![Screenshot](https://github.com/Daxiongmao87/legend-lore-foundry/blob/main/images/screenshot_generate_page.png)

### Content Generation Highlight Feature

![Screenshot](https://github.com/Daxiongmao87/legend-lore-foundry/blob/main/images/screenshot_highlight.png)


## Requirements

* Access to an LLM API: Access to an LLM API  is necessary to utilize the AI content generation features.  Here are some options:

* OpenAI (paid)
* Perplexity (paid)
* Anthropic (paid)
* Grok (paid)
* Google AI Studio (free for now)
* Open WebUI (self-hostable)
* Ollama (self-hostable)
* KoboldCPP (self-hostable)

**NOTE: Models that support JSON mode or are traind on some JSON output are recommended for less error-prone results.

**NOTE: Generation has costs.  Please be aware that generation can be expensive, especially with paid APIs.  Please research the costs associated with using these services.

## Installation

Install just like any Foundry VTT module:
1. Open the Add-on Modules tab in the Configuration and Setup dialog.
2. Click Install Module.
3. Search for "Legend Lore" in the module list and click Install.  Alternatively, paste the following URL into the Manifest URL field: `https://github.com/daxiongmao87/legend-lore-foundry/releases/latest/download/module.json`
4. Click Install.

## Configuration
Below are the configuration options for the module:
1. **Journal Entry Templates:** Choose which journal compendiums to use for templates.
2. **Enable HTTPS:** Enable this if your service requires HTTPS.
3. **Text Generation API URL:** This is the URL for the API you are using.  This can be a local or remote URL.
4. **API Key
5. **Models:** Providing a comma-delimited list of models will allow you to switch between models when generating content.  This is useful if you have multiple models available to you.
6. **Payload JSON:** This sets the structure of the JSON payload that is sent to the AI model.  The default is set to OpenAI's expected JSON format.  You can customize this to fit the requirements of the AI model you are using.
7. **Response JSON Path:** This is the path to the content in the JSON response from the AI model.  This is used to extract the content from the response.
8. **Reasoning End Tag:** This is the tag that the module will use to determine the end of the reasoning section of the generated content.  This is used to filter the reasoning output out of the generated content.
9. **Generation Try Limit:** This is the number of times the module will attempt to generate content before giving up.  This is useful if the AI model is not responding or is returning errors.
10. **Global Context:** This is the global context that is sent to the AI model with every request.  This is useful for setting up a global context that is used for every request.

### 1. Journal Entry Templates
You can choose which journal compendiums to use for templates.
### 2. Enable HTTPS
Enable this if your service requires HTTPS.

* Note, if you're self-hosting, and are using a self-signed certificate, this will not work.  You'll need to either have an http endpoint or a valid certificate for https
### 3. Text Generation API URL
This is the URL for the API you are using.  This can be a local or remote URL.

#### Endpoint Examples
<div>
    <details>
        <summary>OpenAI API</summary>
        <pre>
        https://api.openai.com/v1/chat/completions
        </pre>
    </details>
    <details>
        <summary>Open WebUI</summary>
        <pre>
        http://localhost:5000/api/chat/completions
        </pre>
    </details>
    <details>
        <summary>Google AI Studio
        <pre>
        https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=<GEMINI_API_KEY>
        </pre>
    </details>

* Note: If your API endpoint is not listed here and you've successfully used it with this module, please submit an issue (or PR) to have it added to the list.

### 4. API Key (Optional)
This is the API key for the service you are using.  This is optional, but some services require it.

### 5. Models
Providing a comma-delimited list of models will allow you to switch between models when generating content.  This is useful if you have multiple models available to you.

### 6. Payload JSON
This sets the structure of the JSON payload that is sent to the AI model.  The default is set to OpenAI's expected JSON format.  You can customize this to fit the requirements of the AI model you are using.

The following placeholders are for the module to replace with the appropriate values:
* `{{Model}}` - The model selected within the generation dialog
* `{{GenerationContext}}` - The context input submitted to

#### Template Examples
<details>
    <summary>OpenAI API</summary>
    <pre>
    {
      "model": "{{Model}}",
      "messages": [
        {
          "role": "system",
          "content": "You are a narrative generator for role-playing game journals. The content must be diegetic. Avoid anachronistic references. Your output must be a valid JSON object. The following JSON contains your output instructions. Consider everything wrapped in square brackets '[]' as instructions for you to follow."
        },
        {
          "role": "user",
          "content": "{{GenerationContext}}"
        }
      ],
      "response_format": {{ContentTemplate}},
    }
    </pre>
</details>
<details>
    <summary>Open WebUI</summary>
    <pre>
    {
      "model": "{{Model}}",
      "messages": [
        {
          "role": "system",
          "content": "You are a narrative generator for role-playing game journals. The content must be diegetic. Avoid anachronistic references. Your output must be a valid JSON object. The following JSON contains your output instructions. Consider everything wrapped in square brackets '[]' as instructions for you to follow. Response format: '{{ContentTemplate}}'",
        },
        {
          "role": "user",
          "content": "{{GenerationContext}}"
        }
      ],
      "stream": false
    }
    </pre>
</details>
<details>
    <summary>Google AI Studio</summary>
    <pre>
    {
      "system_instruction": {
        "parts": {
          "text": "You are a narrative generator for role-playing game journals. The content must be diegetic. Avoid anachronistic references. Your output must be a valid JSON object. The following JSON contains your output instructions. Consider everything wrapped in square brackets '[]' as instructions for you to follow. Response format: '{{ContentTemplate}}'"
        }
      },
      "contents": {
      "parts": {
        "text": "{{GenerationContext}}"
        }
      }
    }
    </pre>
</details>
:q

* Note: If your API endpoint is not listed here and you've successfully used it with this module, please submit an issue (or PR) to have it added to the list.

### 7. Response JSON Path
This is the path to the content in the JSON response from the AI model.  This is used to extract the content from the response.

#### Response JSON Path Examples
<details>
    <summary>OpenAI API</summary>
    <pre>
    choices.0.message.content
    </pre>
</details>
<details>
    <summary>Open WebUI</summary>
    <pre>
    choices.0.message.content
    </pre>
</details>
<details>
    <summary>Google AI Studio</summary>
    <pre>
    .candidates.0.content.parts.0.text
    </pre>
</details>

* Note: If your API endpoint is not listed here and you've successfully used it with this module, please submit an issue (or PR) to have it added to the list.

### 8. Reasoning End Tag
This is the tag that the module will use to determine the end of the reasoning section of the generated content.  This is used to filter the reasoning output out of the generated content.

### 9. Generation Try Limit
This is the number of times the module will attempt to generate content before giving up.  This is useful if the AI model is not responding or is returning errors.

### 10. Global Context
This is the global context that is sent to the AI model with every request.  This is useful for setting up a global context that is used for every request.

___
[badge_version]: https://img.shields.io/github/v/tag/daxiongmao87/legend-lore-foundry?label=Version&style=plastic&color=2577a1
[badge_issues]: https://img.shields.io/github/issues/daxiongmao87/legend-lore-foundry?label=Issues&style=plastic
[badge_downloads]: https://img.shields.io/github/downloads/daxiongmao87/legend-lore-foundry/total?label=Downloads&style=plastic
[badge_fvtt_versions]: https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https://github.com/daxiongmao87/legend-lore-foundry/releases/latest/download/module.json&style=plastic&color=ff6400&logo=
