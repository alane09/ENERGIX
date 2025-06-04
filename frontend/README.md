# COFICAB - Gestion Énergétique Dashboard

Application de gestion et d'analyse de la consommation énergétique pour COFICAB.

## Fonctionnalités

- **Dashboard interactif** : Visualisation des KPIs et des tendances de consommation énergétique
- **Analyse SER** : Calcul et analyse de la spécifique énergétique de référence
- **Génération de rapports** : Création de rapports PDF et Excel personnalisés
- **Import de données** : Upload et traitement de fichiers Excel

## Technologies utilisées

- **Frontend** : Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components** : Shadcn UI, Lucide React, Framer Motion
- **Data Visualization** : Recharts
- **PDF Generation** : jsPDF, jspdf-autotable
- **Backend** : Java Spring Boot (API REST)

## Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/coficab/energy-management.git
cd energy-management/frontend
```

2. Installer les dépendances :
```bash
npm install
# ou
yarn install
```

3. Démarrer le serveur de développement :
```bash
npm run dev
# ou
yarn dev
```

4. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Configuration

Pour configurer l'application, vous pouvez modifier les variables d'environnement dans le fichier `.env.local` :

```
```

## Déploiement

Pour construire l'application pour la production :

```bash
npm run build
# ou
yarn build
```

## Licence

Propriétaire - COFICAB 2025
