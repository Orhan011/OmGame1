#!/bin/bash

# Bu script OmGame projesini GitHub'a yüklemek için kullanılır

# Önce git remote adresinin doğru olduğundan emin olalım
git remote set-url origin https://github.com/Orhan120/OmGame

# Değişiklikleri ekleyelim
git add .

# Commit edelim
git commit -m "OmGame: Eğitim ve Oyun Platformu güncellemesi"

echo "GitHub kullanıcı adınızı girin:"
read username

echo "GitHub için kişisel erişim tokeninizi (veya şifrenizi) girin:"
read -s token

# GitHub'a push edelim (kimlik bilgilerini URL içine gömülü olarak ekleyelim)
git push https://$username:$token@github.com/Orhan120/OmGame main

echo ""
echo "İşlem tamamlandı!"