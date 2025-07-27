
# Guide de Configuration MCP pour Claude CLI

## Vue d'ensemble

Ce guide explique comment configurer les serveurs MCP (Model Context Protocol) pour Claude CLI et Claude Desktop.

## Configuration Claude CLI

### 1. Créer la structure de fichiers

```bash
mkdir -p ~/.claude
```

### 2. Ajouter les serveurs MCP manuellement

```bash
# Context7 - Documentation et exemples
claude mcp add-json context7 '{"command": "npx", "args": ["-y", "@upstash/context7-mcp@latest"]}'

# Puppeteer - Automatisation navigateur
claude mcp add-json puppeteer '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-puppeteer"]}'

# Perplexity - Recherche web IA
claude mcp add-json perplexity-mcp '{"command": "uvx", "args": ["perplexity-mcp"], "env": {"PERPLEXITY_API_KEY": "votre_clé_api", "PERPLEXITY_MODEL": "sonar"}}'

# Supabase - Base de données
claude mcp add-json supabase '{"command": "npx", "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "votre_token_supabase"]}'
```

### 3. Vérifier la configuration

```bash
claude mcp list
```

## Configuration Claude Desktop

### Fichier de configuration

**Emplacement** : `/Users/[username]/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "perplexity-mcp": {
      "env": {
        "PERPLEXITY_API_KEY": "votre_clé_api",
        "PERPLEXITY_MODEL": "sonar"
      },
      "command": "uvx",
      "args": ["perplexity-mcp"]
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "votre_token_supabase"
      ]
    },
    "Zapier": {
      "url": "https://mcp.zapier.com/api/mcp/s/[votre_url_zapier]"
    }
  }
}
```

## Serveurs MCP Disponibles

### 1. Context7 📚
- **Usage** : Recherche de documentation officielle, exemples de code
- **Activation** : Automatique pour les questions sur les frameworks
- **Commandes** : `/explain`, `/implement`, `/build`

### 2. Puppeteer 🌐
- **Usage** : Tests E2E, automatisation navigateur, captures d'écran
- **Activation** : Automatique pour les tests et automation
- **Commandes** : `/test`, workflows d'automatisation

### 3. Perplexity 🔍
- **Usage** : Recherche web avec IA, informations récentes
- **Activation** : Recherches web, informations actuelles
- **API Key** : Nécessaire depuis Perplexity.ai

### 4. Supabase 🗄️
- **Usage** : Opérations base de données, requêtes SQL
- **Activation** : Opérations sur votre projet Supabase
- **Token** : Service Role Key depuis Supabase Dashboard

### 5. Zapier ⚡
- **Usage** : Automatisation workflows, intégrations
- **Activation** : Automatisation inter-applications
- **URL** : Endpoint Zapier MCP personnalisé

## Dépannage

### Problème : "No MCP servers configured"

1. **Claude CLI** :
   ```bash
   claude mcp list  # Vérifier la configuration
   /doctor          # Diagnostiquer les problèmes
   ```

2. **Claude Desktop** :
   - Quitter complètement Claude Desktop (`Cmd + Q`)
   - Relancer l'application
   - Vérifier le chemin du fichier de config

### Problème : Serveur ne se connecte pas

1. Vérifier les dépendances npm/uvx
2. Tester manuellement :
   ```bash
   npx -y @upstash/context7-mcp@latest
   ```
3. Vérifier les variables d'environnement

### Problème : Multiple installations de Claude CLI

- Utiliser `which claude` pour identifier l'installation active
- Préférer l'installation locale SuperClaude : `~/.claude/local/claude`

## Sécurité

### Recommandations

1. **Variables d'environnement** pour les clés API :
   ```bash
   # Dans ~/.zshrc ou ~/.bash_profile
   export PERPLEXITY_API_KEY="votre_clé"
   export SUPABASE_SERVICE_ROLE_KEY="votre_token"
   ```

2. **Configuration sécurisée** :
   ```json
   {
     "env": {
       "PERPLEXITY_API_KEY": "env:PERPLEXITY_API_KEY"
     }
   }
   ```

3. **Fichiers à ignorer** dans `.gitignore` :
   ```
   claude_desktop_config.json
   .env.local
   ```

## Utilisation dans le Projet

Voir [CLAUDE.md](../CLAUDE.md) section "Plan & Review" pour l'intégration dans le workflow de développement.

---

**Dernière mise à jour** : Juillet 2025  
**Version Claude CLI** : 1.0.61  
**Serveurs testés** : Context7, Puppeteer, Perplexity, Supabase, Zapier