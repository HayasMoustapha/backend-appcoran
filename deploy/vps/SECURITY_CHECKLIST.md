# Sécurité VPS — Checklist

## SSH
- Désactiver root login
- Auth par clé SSH uniquement

## Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Fail2ban
```bash
sudo apt-get install -y fail2ban
sudo systemctl enable --now fail2ban
```

## Backend
- Rate limiting activé (`AUTH_RATE_LIMIT_*`)
- Limite taille upload (`MAX_UPLOAD_MB`)
- Validation MIME côté backend (déjà en place)

## Nginx
- Headers sécurité (nosniff, frame options)
- HTTPS obligatoire
