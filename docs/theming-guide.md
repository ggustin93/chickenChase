# 🎨 Guide du Système de Theming - Chicken Chase

## Vue d'Ensemble

Ce guide présente le nouveau système de theming professionnel basé sur votre palette de couleurs sophistiquée. Le système est conçu selon les principes du **PhD-level UX/UI design** avec une approche modulaire et évolutive.

## 🎯 Palette de Couleurs

### Couleurs Principales
```css
--color-charcoal: #264653      /* Charcoal - Texte principal */
--color-persian-green: #2a9d8f /* Persian Green - Actions secondaires */
--color-tangerine: #f58a07     /* Tangerine - Actions principales */
--color-rose-quartz: #b0a1ba   /* Rose Quartz - Accents */
--color-lavender-web: #d7dae5  /* Lavender Web - Arrière-plans */
```

### Mapping Sémantique
```css
--color-primary: var(--color-tangerine)      /* Actions principales */
--color-secondary: var(--color-persian-green) /* Actions secondaires */
--color-accent: var(--color-rose-quartz)     /* Éléments d'accent */
--color-neutral-dark: var(--color-charcoal)  /* Texte & contours */
--color-neutral-light: var(--color-lavender-web) /* Arrière-plans */
```

## 🏗️ Architecture du Système

### Structure des Fichiers
```
src/theme/
├── design-system.css     # Variables globales et système de base
├── ionic-theme.css       # Integration Ionic React
├── component-themes.css  # Thèmes de composants spécialisés
└── variables.css         # Point d'entrée principal
```

### Système de Variables

#### Espacement (Base 8px)
```css
--space-xs: 0.25rem    /* 4px */
--space-sm: 0.5rem     /* 8px */
--space-md: 1rem       /* 16px */
--space-lg: 1.5rem     /* 24px */
--space-xl: 2rem       /* 32px */
--space-2xl: 3rem      /* 48px */
--space-3xl: 4rem      /* 64px */
```

#### Bordures et Rayons
```css
--radius-sm: 0.25rem   /* 4px - Petits éléments */
--radius-md: 0.5rem    /* 8px - Éléments standards */
--radius-lg: 0.75rem   /* 12px - Cartes */
--radius-xl: 1rem      /* 16px - Cartes importantes */
--radius-2xl: 1.5rem   /* 24px - Sections hero */
--radius-full: 9999px  /* Cercles parfaits */
```

#### Ombres Progressives
```css
--shadow-sm: /* Éléments flottants légers */
--shadow-md: /* Cartes standards */
--shadow-lg: /* Cartes élevées */
--shadow-xl: /* Modales et overlays */
```

## 🎮 Composants Spécialisés

### 1. Thème Lobby
```html
<div class="lobby-theme">
  <div class="lobby-hero">
    <h1 class="lobby-hero-title">Titre du Lobby</h1>
    
    <!-- Code de partie -->
    <div class="game-code-container">
      <div class="game-code-text">DR8E26</div>
    </div>
    
    <!-- Statistiques -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">5</div>
        <div class="stat-label">Joueurs</div>
      </div>
    </div>
  </div>
</div>
```

### 2. Thème Équipes
```html
<div class="team-theme">
  <!-- Équipe Poulet -->
  <div class="team-card team-chicken">
    <div class="team-header">
      <div class="team-title">
        <ion-icon name="star" class="team-icon"></ion-icon>
        Équipe Poulet
        <div class="team-badge">STAR</div>
      </div>
    </div>
    <div class="team-members">
      <div class="member-chip">Alex</div>
    </div>
  </div>
  
  <!-- Équipe Chasseur -->
  <div class="team-card team-hunter">
    <!-- Structure similaire -->
  </div>
</div>
```

### 3. Thème Boutons
```html
<div class="button-theme">
  <!-- Bouton d'action principale -->
  <ion-button class="btn-primary-action">
    <ion-icon name="star" slot="start"></ion-icon>
    Action Principale
  </ion-button>
  
  <!-- Bouton secondaire -->
  <ion-button class="btn-secondary">
    Action Secondaire
  </ion-button>
  
  <!-- Boutons spécialisés -->
  <ion-button class="btn-chicken">Devenir Poulet</ion-button>
  <ion-button class="btn-hunter">Équipe Chasseur</ion-button>
</div>
```

### 4. Thème Cartes
```html
<div class="card-theme">
  <!-- Carte élevée avec hover -->
  <ion-card class="card-elevated">
    <ion-card-content>Contenu</ion-card-content>
  </ion-card>
  
  <!-- Carte interactive -->
  <ion-card class="card-interactive">
    <ion-card-content>Cliquable</ion-card-content>
  </ion-card>
  
  <!-- Cartes d'état -->
  <ion-card class="card-success">Succès</ion-card>
  <ion-card class="card-warning">Attention</ion-card>
  <ion-card class="card-danger">Erreur</ion-card>
  <ion-card class="card-info">Information</ion-card>
</div>
```

## 🎨 Couleurs Ionic Personnalisées

### Nouvelles Couleurs Disponibles
```typescript
// Dans vos composants Ionic
<IonButton color="chicken">Équipe Poulet</IonButton>
<IonButton color="hunter">Équipe Chasseur</IonButton>
<IonButton color="neutral">Neutre</IonButton>

<IonChip color="chicken">Chip Poulet</IonChip>
<IonChip color="hunter">Chip Chasseur</IonChip>

<IonBadge color="chicken">Badge</IonBadge>
```

### Mapping Automatique
- `primary` → Tangerine (Actions principales)
- `secondary` → Persian Green (Actions secondaires)  
- `tertiary` → Rose Quartz (Accents)
- `chicken` → Tangerine (Équipe Poulet)
- `hunter` → Persian Green (Équipes Chasseurs)

## 🌙 Mode Sombre

Le système inclut un mode sombre automatique basé sur `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --surface-background: #0f1419;
    --surface-card: #232937;
    --text-primary: var(--color-lavender-web);
    /* ... */
  }
}
```

## 📱 Design Responsive

### Breakpoints
```css
--breakpoint-sm: 640px   /* Mobile large */
--breakpoint-md: 768px   /* Tablette */
--breakpoint-lg: 1024px  /* Desktop */
--breakpoint-xl: 1280px  /* Large desktop */
```

### Adaptations Automatiques
- **Mobile**: Textes plus petits, espacement réduit
- **Tablette**: Grilles adaptatives, cartes plus larges
- **Desktop**: Hover effects, espacements généreux

## 🎬 Animations Intégrées

### Classes d'Animation
```html
<div class="animation-theme">
  <div class="fade-in">Apparition en fondu</div>
  <div class="slide-in-left">Glissement gauche</div>
  <div class="slide-in-right">Glissement droite</div>
  <div class="bounce-in">Rebond d'entrée</div>
  <div class="pulse">Pulsation continue</div>
  <div class="shake">Secousse (erreur)</div>
</div>
```

### Transitions Globales
```css
--transition-fast: 150ms ease-in-out    /* Micro-interactions */
--transition-normal: 250ms ease-in-out  /* Interactions standards */
--transition-slow: 350ms ease-in-out    /* Transitions lentes */
```

## 🛠️ Utilisation Pratique

### 1. Mise à Jour d'un Composant Existant
```typescript
// Avant
<IonCard>
  <IonCardContent>
    <IonButton color="primary">Action</IonButton>
  </IonCardContent>
</IonCard>

// Après
<IonCard className="card-elevated">
  <IonCardContent>
    <IonButton className="btn-primary-action">
      <IonIcon name="star" slot="start" />
      Action
    </IonButton>
  </IonCardContent>
</IonCard>
```

### 2. Nouveau Composant
```typescript
import React from 'react';
import { IonCard, IonCardContent, IonButton, IonIcon } from '@ionic/react';
import { star } from 'ionicons/icons';

const MonComposant: React.FC = () => {
  return (
    <div className="team-theme">
      <IonCard className="team-card team-chicken">
        <IonCardContent>
          <div className="team-header">
            <div className="team-title">
              <IonIcon icon={star} className="team-icon" />
              Ma Super Équipe
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};
```

### 3. Variables CSS Personnalisées
```css
/* Dans votre composant CSS */
.mon-composant {
  background: var(--gradient-primary);
  padding: var(--space-lg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  color: var(--text-inverse);
}

.mon-composant:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);
}
```

## 🔧 Personnalisation Avancée

### Créer un Thème Personnalisé
```css
/* Nouveau thème pour une page spécifique */
.mon-theme-custom {
  --color-custom: #ff6b9d;
  --gradient-custom: linear-gradient(135deg, var(--color-custom), var(--color-primary));
}

.mon-theme-custom .card-custom {
  background: var(--gradient-custom);
  color: white;
  border-radius: var(--radius-2xl);
}
```

### Override de Variables
```css
:root {
  /* Personnaliser l'espacement pour votre app */
  --space-component: 1.25rem; /* Espacement spécifique */
  
  /* Personnaliser les couleurs */
  --color-brand: #your-color;
  --gradient-brand: linear-gradient(135deg, var(--color-brand), var(--color-primary));
}
```

## ✅ Bonnes Pratiques

### DO ✅
- Utilisez les variables CSS plutôt que les valeurs hardcodées
- Respectez l'échelle d'espacement (multiples de 8px)
- Combinez les classes thématiques avec les composants Ionic
- Testez en mode sombre et clair
- Utilisez les animations pour améliorer l'UX

### DON'T ❌
- N'overridez pas les variables système sans raison
- N'utilisez pas de couleurs en dehors de la palette
- N'ignorez pas les breakpoints responsive
- Ne créez pas de nouvelles échelles d'espacement
- N'abusez pas des animations

## 🚀 Migration Existante

Pour migrer vos composants existants:

1. **Remplacez les couleurs hardcodées** par les variables CSS
2. **Ajoutez les classes thématiques** appropriées  
3. **Testez la responsivité** sur tous les devices
4. **Vérifiez l'accessibilité** (contraste, focus states)
5. **Optimisez les animations** pour la performance

## 📚 Ressources

- **Fichier de démonstration**: `ThemeShowcase.tsx`
- **Variables globales**: `design-system.css`
- **Intégration Ionic**: `ionic-theme.css`
- **Composants**: `component-themes.css`

---

**Créé avec ❤️ pour Chicken Chase - Design System v2.0**