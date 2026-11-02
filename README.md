# 💸 Mas Cuan - AI Discord Assistant for Freelancers

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_3.8_Flash-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Mas Cuan** is a specialized, AI-powered Discord Bot built for AI Trainers, RLHF Specialists, and Freelancers. It streamlines community management by automating job posting evaluations, providing real-time AI assistance, calculating multi-currency exchange rates, and managing task drop alerts via role-based pinging.

---

## 🏗️ System Architecture

The bot leverages a modern event-driven architecture, processing Discord messages through a central router that delegates tasks to external APIs and LLMs.

```mermaid
graph TD
    A[Discord User] -->|Message / Command| B(Discord.js Client)
    B --> C{Event Router}
    
    %% Job Auto-Scraper Flow
    C -->|Detects Job Link| D[Jina AI Reader]
    D -->|Raw Web Text| E[Google Gemini AI]
    E -->|Extracted JSON| F[#job-opening Channel]
    
    %% AI Assistant Flow
    C -->|!ai command| E
    E -->|Generated Response| G[Discord Reply Embed]
    
    %% Currency & Task Flow
    C -->|!kurs command| H[ExchangeRate API]
    H -->|Real-time IDR Rates| G
    
    C -->|!da, !outlier, etc.| I[Task Alert Module]
    I -->|Role Mention| J[#ping-task Channel]

    style A fill:#5865F2,stroke:#fff,stroke-width:2px,color:#fff
    style E fill:#8E75B2,stroke:#fff,stroke-width:2px,color:#fff