"use strict";
//Nawel ARBOUCHE & Sarah NGUYEN

//INITIALISATION
const hauteur = 600;  //hauteur du canvas game_area1
const largeur = 600; //largeur du canvas game_area1
const taille_vaisseau = 40; //taille d'une image en pixel
const max_nb_aliens = 8; //nombre maximum d'aliens lors d'un spawn
let canvas1;  //pour canvas game_area1
let context1; //pour canvas game_area1
let myvaisseau; //object vaisseau du joueur
let tirs; //object tirs 
let tab_aliens = []; //tableau repertoriant les aliens présent sur l'écran
let tab_tirs = []; //tableau repertoriant les tirs présent sur l'écran
let game_is_over = 0; // 0: le jeu continue     1: le jeu s'arrete
let valeur_collision = taille_vaisseau - 5; //on considère un carré de 35 pixels par 35 pixels ici car l'image mesure 40 pixels (dans le cas contraire il y a trop de chance que la collision ne soit pas détectée)
let score = 0; //ajoute 1 au score quand on tire sur un alien
let div_score; //div où est inscrit le score
let div_message; //div où est inscrit le message de fin

//CLASSES
class MonObject { // possède les fonctions utilisées par tous les vaisseaux (celui du joueur et ceux des aliens) et les tirs
  constructor(x, y, img, type_position, vitesse, rebond_x, rebond_y) {
    this.x = x;
    this.y = y;
    this.nom_img = img;
    this.type_position = type_position; //gauche : -1  droite: 1
    this.vitesse = vitesse; // temps d'attente avant de déclencher window.setTimeout (permettant de donner l'impression qu'elle bouge)
    this.rebond_x = rebond_x;
    this.rebond_y = rebond_y;
    this.obj_img = '';
    
    this.charger_img(this.nom_img);
  }
  
  charger_img(nom_img) { //fonction chargeant l'image
    this.obj_img = new Image();
    this.obj_img.onload = function() {
    }
    this.obj_img.src = nom_img;
  }

  draw() { //fonction dessinant l'image
    context1.drawImage(this.obj_img, this.x, this.y, taille_vaisseau, taille_vaisseau);
  }
  
  move(dx, dy) { //fonction permettant de "déplacer" l'image
    context1.clearRect(this.x, this.y, taille_vaisseau, taille_vaisseau);
    this.x += dx;
    this.y += dy;
    this.draw();
  }
}


class MonVaisseau extends MonObject { // classe du vaisseau du joueur
  constructor(nom_img) {
    super(largeur/2, hauteur - taille_vaisseau, nom_img);
    this.t1 = 0; //en millisecondes
    this.t2 = 0; //en millisecondes
  }
  
  afficher() { //fonction affichant le vaisseau et appelant commander_MonVaisseau
    super.draw();
    super.move(0, 0);
    window.addEventListener('keydown', commander_MonVaisseau);
  }

  calcul_vitesse() { //fonction calculant la vitesse du vaisseau en temps réel
    let dt = this.t2 - this.t1; 
    return dt/2;
  }
}
  

class AliensVaisseaux extends MonObject { // classe pour les vaisseaux des aliens
  constructor(x, y, nom_img, type_position, vitesse, rebond_x, rebond_y) { //type_position (aliens partant de):  gauche : -1 , droite: 1 
    super(x, y, nom_img, type_position, vitesse, rebond_x, rebond_y);
    this.init()
  }
  
  init() { //fonction d'initialisation appelée au début de la création d'un vaisseau 
    window.setTimeout(deplacer_AliensVaisseaux, this.vitesse, this); //appelle la fonction permettant de le faire se déplacer
  }  
  
  detect_rebond() { //fonction détectant quand un vaisseau touche le bord de l'écran (en haut, en bas, à gauche ou à droite) et le fait rebondir 
    if (this.y < 0 || this.y > (hauteur - taille_vaisseau)) {
      this.rebond_y = -1 * this.rebond_y; //rebond en y
      this.vitesse = this.vitesse - this.vitesse * 0.1; //gagne 10% en vitesse
    } else if (this.x < 0 || this.x > (largeur - taille_vaisseau)) { 
      this.rebond_x = -1 * this.rebond_x; //rebond en x
      this.vitesse = this.vitesse - this.vitesse * 0.1; //gagne 10% en vitesse
    }
  }
  
  collision_aliens() { //fonction détectant les collisions de vaisseau alien
    //coord petit carée myvaisseau
    let cx = myvaisseau.x + taille_vaisseau/2;
    let cy = myvaisseau.y + taille_vaisseau/2;
    let x1 = cx - valeur_collision/2;
    let x2 = x1 + valeur_collision;
    let y1 = cy - valeur_collision/2;
    let y2 = y1 + valeur_collision;
    //let collision_tir = 0
    
    //coord petit carée alien
    let x = this.x;
    let y = this.y;
    
    let ax = this.x + taille_vaisseau/2;
    let ay = this.y + taille_vaisseau/2;
    let ax1 = ax - valeur_collision/2;
    let ax2 = ax1 + valeur_collision;
    let ay1 = ay - valeur_collision/2;
    let ay2 = ay1 + valeur_collision;
      
    if (((x1< ax1 && ax1 <x2) || (x1< ax2 && ax2 <x2)) && 
        ((y1< ay1 && ay1 <y2) || (y1< ay2 && ay2 <y2)) ){ //collision entre vaisseau du joueur et vaisseau alien
        game_over(); //fin du jeu
        return 0;
      }
      
    for (let i = 0; i < tab_tirs.length; i++) { //pour chaque tir présent dans la liste tab_tirs
      //coord petit carée elem_tir
      let elem_tir = tab_tirs[i];
      let mx = elem_tir.x + taille_vaisseau/2;
      let my = elem_tir.y + taille_vaisseau/2;
      let mx1 = mx - valeur_collision/2;
      let mx2 = mx1 + valeur_collision;
      let my1 = my - valeur_collision/2;
      let my2 = my1 + valeur_collision;

      if (((ax1< mx1 && mx1 <ax2) || (ax1< mx2 && mx2 <ax2)) && 
        ((ay1< my1 && my1 <ay2) || (ay1< my2 && my2 <ay2)) ){ //collision entre vaisseau alien et tir
        elem_tir.collision = 1;
        deplacer_tir(elem_tir) 
        return 1;
      }
    }
    return 0;
  }
}
  

class Tirs extends MonObject{ // classe pour les tirs 
  constructor(x, y, nom_img, vitesse) {
    super(x, y, nom_img, '', vitesse);
    this.tirer();
    this.position_origine = y; 
    this.collision = 0;
  }
  
  tirer() { //fonction d'initialisation appelée au début de la création d'un tir
    window.setTimeout(deplacer_tir, this.vitesse, this);
  }
  
  collision_tirs() { //fonction détectant les collisions de tir avec vaisseau du joueur
    //coord petit carée myvaisseau
    let cx = myvaisseau.x + taille_vaisseau/2;
    let cy = myvaisseau.y + taille_vaisseau/2;
    let x1 = cx - valeur_collision/2;
    let x2 = x1 + valeur_collision;
    let y1 = cy - valeur_collision/2;
    let y2 = y1 + valeur_collision;

    //coord petit carée tir
    let mx = this.x + taille_vaisseau/2;
    let my = this.y + taille_vaisseau/2;
    let mx1 = mx - valeur_collision/2;
    let mx2 = mx1 + valeur_collision;
    let my1 = my - valeur_collision/2;
    let my2 = my1 + valeur_collision;
    
    if (((x1< mx1 && mx1 <= x2) || (x1< mx2 && mx2 < x2)) && 
        ((y1< my1 && my1 < y2) || (y1< my2 && my2 < y2)) ){ 
      game_over() //fin du jeu
    }
  }
}


//FONCTIONS

//Aliens
function randomInt(max, min) { //retourne un entier au hazard entre min et max 
  return Math.floor(Math.random() * (max - min + 1)) + min
}
  
function init_tab_aliens() { //spawn d'un nombre aliens compris entre 2 et max_nb_aliens qui soit pair (pour qu'il y ait autant de chaque coté)
  let nb_aliens = randomInt(max_nb_aliens, 2);
  if (nb_aliens % 2 != 0) { //si nb_aliens est impair
    nb_aliens += 1;
  }
  
  let type_position = 1; // position du vaisseau alien au début (gauche : -1 , droite: 1) 
  for (let i=0; i< nb_aliens; i+=1) {
    let x = 0;
    let y = randomInt(hauteur*2/3, 0);
    let vitesse = 300;
    let rebond_x = 1; 
    let rebond_y = 1; 
    type_position = -1 * type_position;
    
    if (type_position == 1) {
      x = largeur - taille_vaisseau;
    }
    
    let aliensvaisseaux = new AliensVaisseaux(x, y, "vaisseau_extra-terrestre.png", type_position, vitesse, rebond_x, rebond_y);
    tab_aliens.push(aliensvaisseaux);
  }
  //console.table(tab_aliens);
  if (game_is_over) {
  window.setTimeout(init_tab_aliens, 8000); //nouveau spawn d'alien toutes les 8 secondes
  }
}
  
//Tirs
function init_tirs(obj_vaisseau) { //initialisation tir: l'ajoute dans le tableau
  let vitesse = obj_vaisseau.calcul_vitesse();
  tirs = new Tirs(obj_vaisseau.x, obj_vaisseau.y - taille_vaisseau*2/3, "tir.png", vitesse);
  tab_tirs.push(tirs);
}

//Fonctions de déplacements
function deplacer_tir(obj_tir) { //déplace le tir et le détruit quand nécessaire
  if (game_is_over) {
    obj_tir.draw();
    
    let distance = obj_tir.y - obj_tir.position_origine; //calcul distance parcourus par le tir
    if (- distance < hauteur/2 && obj_tir.collision == 0) {
      obj_tir.draw();
      myvaisseau.draw();
      obj_tir.collision_tirs();
      obj_tir.move(0, -5);
      window.setTimeout(deplacer_tir, obj_tir.vitesse, obj_tir);
    } else { //détruit le tir quand il a parcourus une distance correspondant à la moitié de la hauteur du canvas
      context1.clearRect(obj_tir.x, obj_tir.y, taille_vaisseau, taille_vaisseau);
      let index = tab_tirs.indexOf(obj_tir);
      tab_tirs.splice(index, 1);
    }
  }
}

function deplacer_AliensVaisseaux(obj_vaisseau) { //déplace vaisseau alien et le détruit quand nécessaire
  if (game_is_over) {
    obj_vaisseau.detect_rebond() //détecte les rebonds
    obj_vaisseau.draw(); //dessine le vaisseau
    let dx = 0;
    let dy = 0;
    if (obj_vaisseau.type_position == -1) { //aliens de gauche à droite
      dx = 5 * obj_vaisseau.rebond_x;
      dy = 5 * obj_vaisseau.rebond_y;
    } else if (obj_vaisseau.type_position == 1) { //aliens de droite à gauche
      dx = -5 * obj_vaisseau.rebond_x;
      dy = 5 * obj_vaisseau.rebond_y;
    }
    
    let collision_tir = obj_vaisseau.collision_aliens(); //collision_tir:  1: collision , 0: pas de collision
    
    if (collision_tir == 1) { //quand vaisseau alien est entré en collision
      score += 1;
      div_score.innerHTML = "SCORE : " + score;
      context1.clearRect(obj_vaisseau.x, obj_vaisseau.y, taille_vaisseau, taille_vaisseau); //efface le vaisseau alien 
      
      let index = tab_aliens.indexOf(obj_vaisseau);
      tab_aliens.splice(index); //le retire du tableau
      //console.table(tab_aliens);
      
    } else {
      obj_vaisseau.move(dx, dy);
      window.setTimeout(deplacer_AliensVaisseaux, obj_vaisseau.vitesse, obj_vaisseau);
    }
  }
}

function commander_MonVaisseau(event) { //commande du clavier pour vaisseau joueur
  if (game_is_over) {
    let dx = 0;
    let dy = 0;
    let e = event.keyCode;
    let temps = new Date();
    myvaisseau.t1 = myvaisseau.t2;
    myvaisseau.t2 = temps.getMilliseconds();
    
    if (e == 39)  { // vers la droite 
      dx = 5; 
    } else if (e == 37) { // vers la gauche 
      dx = -5; 
    } else if (e == 38) { // vers le haut
      dy = -5; 
    } else if (e == 40) { // vers le bas
      dy = 5; 
    } else if (e == 32) { //tirer (touche espace)
      init_tirs(myvaisseau);
    } 
    myvaisseau.move(dx, dy);
  }
}

function start_game() { //pendant le jeu
  div_message.innerHTML = "";
  div_score.innerHTML = "SCORE : " + score;
  context1.clearRect(0, 0, largeur, hauteur);
  game_is_over = 1;
  let bouton = document.getElementById('bouton_start');
  bouton.style.display = "none";
  init_tab_aliens();
  myvaisseau = new MonVaisseau("my_vaisseau.png");
  myvaisseau.afficher();
}
//FIn
function game_over() { //fin de jeu
  div_message.innerHTML = "GAME OVER";
  let bouton = document.getElementById('bouton_start');
  
  //reinitialisation
  game_is_over = 0;
  bouton.style.display = "block";
  tab_aliens.splice(0, tab_aliens.length);
  tab_tirs.splice(0, tab_tirs.length);
  score = 0
  tab_aliens = [];
  tab_tirs = [];
}

window.onload = function() {
  canvas1 = document.getElementById('game_area1');
  context1 = canvas1.getContext("2d");
  div_score = document.getElementById('score');
  div_message = document.getElementById('message');
}