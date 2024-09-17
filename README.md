# Legend Lore Module for Foundry VTT
![badge_version] ![badge_issues] ![badge_downloads]
![badge_fvtt_versions]

[<img src="https://img.shields.io/badge/Support%20My%20Work-Buy%20me%20a%20coffee%20%E2%98%95-chocolate?style=plastic">](https://www.buymeacoffee.com/daxiongmao87)

![Screenshot](https://github.com/Daxiongmao87/legend-lore-foundry/blob/main/images/screenshot_dialog.png)

## Introduction

**Legend Lore** is an innovative module for Foundry Virtual Tabletop that leverages the power of OpenAI to enhance storytelling and world-building in tabletop RPGs. It allows game masters to generate rich, AI-assisted text content, such as detailed journal entries, descriptions, and narrative elements, directly within Foundry VTT.

***NOTE**: This module requires an active OpenAI API key to function. Ensure that your key is securely stored and never exposed to clients.*

## Key Features

 * **AI-Powered Content Generation:** Seamlessly integrate OpenAI's powerful language models to enrich your game sessions.
 * **Dynamic Generation of Highlighted Text:** Highlight to generate any text from existing content within the editor.
 * **Customizable Settings:** Configure AI models, temperature settings, and other parameters to tailor the AI's output to your campaign.
 * **Built-in & User Templates:** Template choices are populated by the journal compendiums selected within the module's settings, with the default _Journal Entry Templates Compendium_ containing many templates to get you started.
 * **Local LLM Support** Use your own LLM. _Experimental_

### List of Templates
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

* OpenAI API Key: A valid API key from OpenAI is necessary to utilize the AI content generation features.

**NOTE: This is not required if using a local LLM**

**NOTE: Only models that support JSON mode are compatible with this module.  Please see [OpenAI Models](https://platform.openai.com/docs/models) for more info.**
  
**NOTE: Generation has costs.  Please see [OpenAI Pricing](https://openai.coam/pricing) for more info.**

## Installation and Setup

After installing the module, navigate to the module settings in Foundry VTT to enter your OpenAI API key and configure the desired settings for AI models and content generation preferences. 

For local LLM, provide the url (usually localhost:PORT), and disable https. Please note this feature is experimental, and your results are dependant on the model and settings you use. If the response from your LLM is not formatted right, or the model hallucinates, or stops generating because it has reached its context limit, the JSON will fail to parse.

## Usage

With the module enabled, you can use the provided UI tools and extensions within Foundry VTT to generate and manage AI-assisted content. The module integrates directly with the journal system and other Foundry VTT features, offering a seamless and enriching gameplay experience.

[badge_version]: https://img.shields.io/github/v/tag/daxiongmao87/legend-lore-foundry?label=Version&style=plastic&color=2577a1
[badge_issues]: https://img.shields.io/github/issues/daxiongmao87/legend-lore-foundry?label=Issues&style=plastic
[badge_downloads]: https://img.shields.io/github/downloads/daxiongmao87/legend-lore-foundry/total?label=Downloads&style=plastic
[badge_fvtt_versions]: https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https://github.com/daxiongmao87/legend-lore-foundry/releases/latest/download/module.json&style=plastic&color=ff6400&logo=
