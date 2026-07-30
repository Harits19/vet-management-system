bash                                                                                                                  
    1. SSH ke VPS                                                                                                         
    ssh ubuntu@43.157.243.138                                                                                             
                                                                                                                          
    2. Clone projek
    git clone https://github.com/Harits19/vet-management-system                                                                            
    cd vet-management-system                                                                                              
                                                                                                                          
    3. Buat .env                                                                                                          
    cp .env.production.example .env                                                                                       
    nano .env   # isi JWT_SECRET, ganti password default
                                                                                                                          
    4. Buat DNS record A → 43.157.243.138                                                                                 
                                                                                                                          
    5. Build & start                                                                                                      
    docker compose -f docker-compose.prod.yml build
    docker compose -f docker-compose.prod.yml up -d

                                                                                                                          
    Nginx otomatis serve frontend di / dan proxy API di /api/. Tinggal pointing DNS aja.