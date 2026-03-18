# Contexte Backend : Refonte du Dashboard

Ce fichier documente les nouveaux besoins en données du Front-End suite à la refonte visuelle du Dashboard (basée sur la maquette `dashboard_athli.ai_refondu_clair`).
Actuellement, le front-end utilise des données factices (mockées) pour obtenir ce rendu. Le développeur Backend doit s'y référer pour faire évoluer le modèle de base de données (Prisma/SQLAlchemy) et les API FastAPI.

## Nouveaux Endpoints / Modifications d'API requises

Afin d'alimenter le nouveau Dashboard tel qu'il est affiché sur l'application mobile, le Front-End s'attend à recevoir une payload similaire à celle-ci lors de l'appel à la route `/api/dashboard/summary` (ou équivalent) :

### 1. Header de l'utilisateur
- **Besoin :** Photo de profil `avatar_url`, et le prénom/pseudo de l'utilisateur.

### 2. Readiness Forme du Jour (`/api/readiness/latest`)
L'ancien endpoint renvoyait `ai_advice`. Il faut l'enrichir considérablement avec des données contextuelles (provenant peut-être de la santé d'Apple/Google Fit à l'avenir, ou saisies manuellement) :
- `readiness_score` (Int) : Entier de 0 à 100 pour afficher la jauge circulaire géante.
- `readiness_status` (String) : ex. "Prêt pour l'entraînement", "Attention - Fatigué", "Repos conseillé" pour le badge.
- `sleep_duration` (String/Int) : Durée de sommeil la nuit précédente (ex: "7h 45m" ou minutes brutes `465`).
- `recovery_percentage` (Int) : Pourcentage de récupération estimé (ex: `92`).
- `stress_level` (String) : Niveau de stress (ex: `"Bas"`, `"Moyen"`, `"Élevé"`).

### 3. Bouton "Commencer ma séance" (`/api/workouts/today`)
- **Besoin :** Il nous faut savoir si l'utilisateur a une séance planifiée aujourd'hui, et pouvoir récupérer son `session_id` pour que le gros bouton "Générer / Commencer ma séance" amorce directement le flux d'exercice ou la génération dynamique du workout.

### 4. Progression / Statistiques Courantes (`/api/analytics/summary`)
La section "Ma Progression" contient des cartes avec des visualisations sous forme de graphiques en barres.
- **Calories :** 
  - `current_calories` (Int) : Calories journalières actuelles ou moyennes.
  - `calories_trend` (Float) : Pourcentage d'amélioration/dégradation (ex: `+12%`).
  - `weekly_calories_history` (Array[Int]) : Historique des 5 à 7 derniers jours pour dessiner le graphique en barres.
- **Poids (kg) :**
  - `current_weight` (Float) : Le poids actuel saisi ou enregistré (ex: `78.5`).
  - `weight_trend` (Float) : Progression sur le mois ou la semaine globale (ex: `-0.8` kg).
  - `recent_weight_history` (Array[Float]) : Historique des dernières pesées pour le mini-graphe.

---
**Note au Backend Dev :** Tu peux "vibecoder" l'ajout de ces champs dans le modèle Prisma et SQLAlchemy, générer la migration Supabase, puis l'implémenter dans FastAPI. Le Front-End se chargera de substituer les mock datas par ces points d'API dès qu'ils seront déployés.
