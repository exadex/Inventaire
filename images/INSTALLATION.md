# Favicon ExAdEx Inventaire

Copier les fichiers du pack à la racine du site, puis ajouter ces lignes dans le `<head>` de `index.html` :

```html
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
```

Le fichier SVG est prioritaire dans les navigateurs modernes. Le fichier ICO assure la compatibilité avec les navigateurs plus anciens.
