# Favicon ExAdEx Inventaire

Copier les fichiers du pack dans `assets/images/`, puis ajouter ces lignes dans le `<head>` de `index.html` :

```html
<link rel="icon" href="assets/images/favicon.ico" sizes="any">
<link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">
<link rel="icon" href="assets/images/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">
```

Le fichier SVG est prioritaire dans les navigateurs modernes. Le fichier ICO assure la compatibilité avec les navigateurs plus anciens.
