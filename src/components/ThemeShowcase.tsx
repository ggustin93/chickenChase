import React from 'react';
import {
  IonContent, IonCard, IonCardContent, IonButton, IonIcon, IonChip,
  IonText, IonGrid, IonRow, IonCol, IonBadge, IonItem, IonLabel,
  IonInput, IonHeader, IonToolbar, IonTitle
} from '@ionic/react';
import { 
  star, people, personAdd, copy, checkmarkCircle, 
  alertCircle, trophy, time, people as usersOutline 
} from 'ionicons/icons';

/**
 * Component to showcase the new design system
 * This demonstrates all the theme classes and components
 */
const ThemeShowcase: React.FC = () => {
  return (
    <>
      <IonHeader>
        <IonToolbar className="nav-theme">
          <IonTitle>Design System Showcase</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4 space-y-6">
          
          {/* Hero Section */}
          <section className="lobby-theme">
            <div className="lobby-hero">
              <h1 className="lobby-hero-title">Chicken Chase Design System</h1>
              <IonText>Démonstration de notre palette de couleurs sophistiquée</IonText>
              
              {/* Game Code Example */}
              <div className="game-code-container mt-4">
                <p className="text-sm opacity-90 mb-2">Code de démonstration</p>
                <div className="game-code-text">DR8E26</div>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <IonIcon icon={usersOutline} className="text-2xl mb-1" />
                  <div className="stat-value">5</div>
                  <div className="stat-label">Joueurs</div>
                </div>
                <div className="stat-card">
                  <IonIcon icon={people} className="text-2xl mb-1" />
                  <div className="stat-value">3</div>
                  <div className="stat-label">Équipes</div>
                </div>
                <div className="stat-card">
                  <IonIcon icon={time} className="text-2xl mb-1" />
                  <div className="stat-value">120</div>
                  <div className="stat-label">Minutes</div>
                </div>
              </div>
            </div>
          </section>

          {/* Color Palette */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Palette de Couleurs</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg" 
                        style={{ backgroundColor: 'var(--color-charcoal)' }}
                      ></div>
                      <div>
                        <div className="font-semibold">Charcoal</div>
                        <div className="text-sm text-gray-600">#264653</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg" 
                        style={{ backgroundColor: 'var(--color-persian-green)' }}
                      ></div>
                      <div>
                        <div className="font-semibold">Persian Green</div>
                        <div className="text-sm text-gray-600">#2a9d8f</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg" 
                        style={{ backgroundColor: 'var(--color-tangerine)' }}
                      ></div>
                      <div>
                        <div className="font-semibold">Tangerine</div>
                        <div className="text-sm text-gray-600">#f58a07</div>
                      </div>
                    </div>
                  </div>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg" 
                        style={{ backgroundColor: 'var(--color-rose-quartz)' }}
                      ></div>
                      <div>
                        <div className="font-semibold">Rose Quartz</div>
                        <div className="text-sm text-gray-600">#b0a1ba</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg" 
                        style={{ backgroundColor: 'var(--color-lavender-web)' }}
                      ></div>
                      <div>
                        <div className="font-semibold">Lavender Web</div>
                        <div className="text-sm text-gray-600">#d7dae5</div>
                      </div>
                    </div>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </section>

          {/* Team Cards */}
          <section className="team-theme">
            <h2 className="text-2xl font-semibold mb-4">Cartes d'Équipes</h2>
            
            {/* Chicken Team */}
            <IonCard className="team-card team-chicken">
              <IonCardContent>
                <div className="team-header">
                  <div className="team-title">
                    <IonIcon icon={star} className="team-icon" />
                    <span>Équipe Poulet</span>
                    <div className="team-badge">STAR</div>
                  </div>
                  <IonChip color="chicken" outline>
                    <IonText>1 membre</IonText>
                  </IonChip>
                </div>
                <div className="team-members">
                  <div className="member-chip">
                    <IonIcon icon={trophy} size="small" />
                    Alex
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Hunter Team */}
            <IonCard className="team-card team-hunter">
              <IonCardContent>
                <div className="team-header">
                  <div className="team-title">
                    <IonIcon icon={people} className="team-icon" />
                    <span>Les Chasseurs</span>
                  </div>
                  <IonChip color="hunter" outline>
                    <IonText>2 membres</IonText>
                  </IonChip>
                </div>
                <div className="team-members">
                  <div className="member-chip">Marie</div>
                  <div className="member-chip">Pierre</div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>

          {/* Buttons */}
          <section className="button-theme">
            <h2 className="text-2xl font-semibold mb-4">Boutons</h2>
            <div className="space-y-4">
              <IonButton expand="block" className="btn-primary-action">
                <IonIcon icon={star} slot="start" />
                Devenir l'Équipe Poulet
              </IonButton>
              
              <IonButton expand="block" fill="outline" className="btn-secondary">
                <IonIcon icon={personAdd} slot="start" />
                Rejoindre une Équipe
              </IonButton>
              
              <IonButton expand="block" fill="clear" className="btn-ghost">
                <IonIcon icon={copy} slot="start" />
                Copier le Code
              </IonButton>

              <div className="flex space-x-3">
                <IonButton color="chicken" className="btn-chicken">
                  <IonIcon icon={star} slot="start" />
                  Chicken
                </IonButton>
                <IonButton color="hunter" className="btn-hunter">
                  <IonIcon icon={people} slot="start" />
                  Hunter
                </IonButton>
              </div>
            </div>
          </section>

          {/* Cards */}
          <section className="card-theme">
            <h2 className="text-2xl font-semibold mb-4">Types de Cartes</h2>
            
            <IonCard className="card-elevated">
              <IonCardContent>
                <h3 className="font-semibold mb-2">Carte Élevée</h3>
                <p>Avec ombre et effet hover sophistiqué</p>
              </IonCardContent>
            </IonCard>

            <IonCard className="card-interactive">
              <IonCardContent>
                <h3 className="font-semibold mb-2">Carte Interactive</h3>
                <p>Cliquable avec feedback visuel</p>
              </IonCardContent>
            </IonCard>

            <div className="grid grid-cols-2 gap-4">
              <IonCard className="card-success">
                <IonCardContent>
                  <div className="flex items-center space-x-2">
                    <IonIcon icon={checkmarkCircle} color="success" />
                    <span className="font-semibold">Succès</span>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard className="card-warning">
                <IonCardContent>
                  <div className="flex items-center space-x-2">
                    <IonIcon icon={alertCircle} color="warning" />
                    <span className="font-semibold">Attention</span>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </section>

          {/* Form Elements */}
          <section className="form-theme">
            <h2 className="text-2xl font-semibold mb-4">Éléments de Formulaire</h2>
            
            <div className="input-group">
              <label className="input-label">Nom d'équipe</label>
              <IonInput 
                className="input-field" 
                placeholder="Entrez le nom de votre équipe..."
                fill="outline"
              />
              <div className="input-helper">
                Choisissez un nom unique pour votre équipe
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Code de partie</label>
              <IonInput 
                className="input-field input-error" 
                placeholder="DR8E26"
                fill="outline"
              />
              <div className="input-error-text">
                Code de partie invalide
              </div>
            </div>
          </section>

          {/* Ionic Color System */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Système de Couleurs Ionic</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <IonButton color="primary" fill="solid">Primary</IonButton>
              <IonButton color="secondary" fill="solid">Secondary</IonButton>
              <IonButton color="tertiary" fill="solid">Tertiary</IonButton>
              <IonButton color="success" fill="solid">Success</IonButton>
              <IonButton color="warning" fill="solid">Warning</IonButton>
              <IonButton color="danger" fill="solid">Danger</IonButton>
              <IonButton color="chicken" fill="solid">Chicken</IonButton>
              <IonButton color="hunter" fill="solid">Hunter</IonButton>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <IonChip color="primary">Primary Chip</IonChip>
              <IonChip color="secondary">Secondary Chip</IonChip>
              <IonChip color="chicken">Chicken Chip</IonChip>
              <IonChip color="hunter">Hunter Chip</IonChip>
            </div>
          </section>

        </div>
      </IonContent>
    </>
  );
};

export default ThemeShowcase;