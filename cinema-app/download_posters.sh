#!/bin/bash
mkdir -p uploads

# Список изображений для скачивания (замените на реальные URL или используйте заглушки)
declare -A posters=(
  ["harry-potter.jpg"]="https://m.media-amazon.com/images/M/MV5BNjQ3NWNlNmQtMTE5ZS00MDdmLTlkZjUtZTBlM2UxMGFiMTU3XkEyXkFqcGdeQXVyNjUwNzk3NDc@._V1_FMjpg_UX1000_.jpg"
  ["lotr.jpg"]="https://m.media-amazon.com/images/M/MV5BN2EyZjM3NzUtNWUzMi00MTgxLWI0NTctMzY4M2VlOTdjZWRiXkEyXkFqcGdeQXVyNDUzOTQ5MjY@._V1_.jpg"
  ["intouchables.jpg"]="https://m.media-amazon.com/images/M/MV5BMTYxNDA3MDQwNl5BMl5BanBnXkFtZTcwNTU4Mzc1Nw@@._V1_.jpg"
  ["eurotrip.jpg"]="https://m.media-amazon.com/images/M/MV5BMTI4MzIxNzkzNV5BMl5BanBnXkFtZTcwNjE5MzYyMQ@@._V1_.jpg"
  ["interstellar.jpg"]="https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg"
  ["inception.jpg"]="https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg"
  ["shawshank.jpg"]="https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg"
  ["godfather.jpg"]="https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg"
  ["dark-knight.jpg"]="https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg"
  ["forrest-gump.jpg"]="https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg"
)

echo "Downloading poster images..."
for poster in "${!posters[@]}"; do
  url="${posters[$poster]}"
  echo "Downloading $poster..."
  # Используем curl или wget для скачивания
  # Если нет доступа к интернету, создадим заглушки
  if command -v curl &> /dev/null; then
    curl -s -L "$url" -o "uploads/$poster" --max-time 10 || echo "Failed to download $poster, creating placeholder"
  elif command -v wget &> /dev/null; then
    wget -q -O "uploads/$poster" "$url" || echo "Failed to download $poster, creating placeholder"
  fi
  
  # Если файл не скачался, создаем заглушку
  if [ ! -f "uploads/$poster" ] || [ ! -s "uploads/$poster" ]; then
    convert -size 300x450 xc:#2d3748 -pointsize 20 -fill white -gravity center -draw "text 0,0 '${poster%.*}'" "uploads/$poster" 2>/dev/null || \
    echo "No Image" > "uploads/$poster"
  fi
done

echo "Poster images created in uploads folder"