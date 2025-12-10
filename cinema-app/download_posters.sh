#!/bin/bash

# Создаем необходимые папки
mkdir -p uploads
mkdir -p uploads/trailers

# Список изображений для скачивания
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

echo "Creating poster images..."

# Создаем заглушки для постеров
for poster in "${!posters[@]}"; do
  if [ ! -f "uploads/$poster" ]; then
    echo "Creating placeholder for $poster..."
    # Используем ImageMagick или создаем текстовый файл
    if command -v convert &> /dev/null; then
      convert -size 300x450 xc:#2d3748 -pointsize 20 -fill white -gravity center -draw "text 0,0 '${poster%.*}'" "uploads/$poster" 2>/dev/null
    else
      echo "Placeholder for ${poster%.*}" > "uploads/$poster"
    fi
  fi
done

echo "Creating trailer placeholder files..."

# Создаем заглушки для трейлеров
declare -a trailers=(
  "harry-potter-trailer.mp4"
  "lotr-trailer.mp4"
  "intouchables-trailer.mp4"
  "eurotrip-trailer.mp4"
  "interstellar-trailer.mp4"
  "inception-trailer.mp4"
  "shawshank-trailer.mp4"
  "godfather-trailer.mp4"
  "dark-knight-trailer.mp4"
  "forrest-gump-trailer.mp4"
)

for trailer in "${trailers[@]}"; do
  if [ ! -f "uploads/trailers/$trailer" ]; then
    echo "Creating placeholder for $trailer..."
    # Создаем минимальный mp4 файл (заглушку)
    echo "This is a placeholder for $trailer" > "uploads/trailers/$trailer"
  fi
done

echo "All files created in uploads folder"
echo "Note: For actual trailers, replace the placeholder files in uploads/trailers/ with real mp4 files"