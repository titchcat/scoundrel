let cards = [
    'S2', 'D2', 'C2', 'H2', 'S3', 'D3', 'C3', 'H3', 'S4', 'D4', 'C4', 'H4',
    'S5', 'D5', 'C5', 'H5', 'S6', 'D6', 'C6', 'H6', 'S7', 'D7', 'C7', 'H7', 'S8', 'D8',
    'C8', 'H8', 'S9', 'D9', 'C9', 'H9', 'S10', 'D10', 'C10', 'H10', 'S11', 'C11', 'S12',
    'C12', 'S13', 'C13', 'S14', 'C14'
];

String.prototype.parse = function() {
    let str = this.valueOf();
    let arr = str.split('');
    let suit = arr[0];
    arr.shift();
    let value = parseInt(arr.join(''));
    let type = '';
    if (suit === 'S' || suit === 'C') {
        type = 'bad';
    } else if (suit === 'H') {
        type = 'life';
    } else {
        type = 'weapon';
    }
    return {
        value: value,
        type: type,
        suit: suit
    };
};

function shuffle(array) {
    let currentIndex = array.length;
    let tempArray = [...array];
    
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [tempArray[currentIndex], tempArray[randomIndex]] = [
            tempArray[randomIndex], tempArray[currentIndex]
        ];
    }
    return tempArray;
}

function getSuitSymbol(suit) {
    switch(suit) {
        case 'S': return '♠';
        case 'C': return '♣';
        case 'H': return '♥';
        case 'D': return '♦';
        default: return suit;
    }
}

class Game {
    constructor() {
        this.mid = [];
        this.turnCount = 0;
        this.weapon = '';
        this.badTree = [];
        this.canRun = true;
        this.health = 20;
        this.deck = shuffle([...cards]);
        this.lost = false;
        this.won = false;
        this.selectedCard = null;
        this.score = 0;
    }
    enter() {
        if (this.lost || this.won) return false;
        if (this.mid.length !== 1 && this.deck.length !== 44 && this.canRun) return false;
        while (this.mid.length < 4 && this.deck.length) {
            this.mid.push(this.deck[0]);
            this.deck.shift();
        }
        this.turnCount++;
        return true;
    }
    start() {
        if (this.lost || this.won) return false;
        this.score = 0;
        return this.enter();
    }
    run() {
        if (this.lost || this.won) return false;
        if (this.mid.length === 4 && this.canRun) {
            this.deck.push(...this.mid);
            this.mid = [];
            this.canRun = false;
            this.enter();
            return true;
        } else {
            return false;
        }
    }
    toggleRun() {
        this.canRun = (this.turnCount % 2 === 0);
    }
    discardWeapon() {
        if (!this.weapon) return false;
         this.weapon = '';
        this.badTree = [];
        return true;
    }

    takeWeapon(card) {
        if (this.lost || this.won) return false;
        let data = card.parse();
        if (data.type !== 'weapon') return false;
        if (!this.mid.includes(card)) return false;
        if (this.weapon.length) return false;
        if (this.mid.length === 1) return false;
        this.weapon = card;
        this.mid = this.mid.filter(c => c !== card);
        return true;
    }

    attack(card) {
        if (this.lost || this.won) return false;
        if (!this.mid.includes(card)) return false;
        if (this.mid.length === 1) return false;
        let data = card.parse();
        if (data.type !== 'bad') return false;
        if (this.weapon) {
            let wData = this.weapon.parse();
            if (this.badTree.length) {
                let latest = this.badTree[this.badTree.length - 1].parse();
                if (parseInt(latest.value) <= parseInt(data.value)) return false;
                this.mid = this.mid.filter(c => c !== card);
                this.badTree.push(card);
                if (parseInt(wData.value) < parseInt(data.value)) {
                    this.health -= (parseInt(data.value) - parseInt(wData.value));
                }
                if (this.health <= 0) this.lost = true;
            } else {
                this.mid = this.mid.filter(c => c !== card);
                this.badTree.push(card);
                if (parseInt(wData.value) < parseInt(data.value)) {
                    this.health -= (parseInt(data.value) - parseInt(wData.value));
                }
                if (this.health <= 0) this.lost = true;
            }
        } else {
            this.health -= parseInt(data.value);
            if (this.health <= 0) {
                this.lost = true;
                return true;
            }
            this.mid = this.mid.filter(c => c !== card);
        }
        
        let hasBadCards = false;
        for (let card of this.mid) {
            let cardData = card.parse();
            if (cardData.type === 'bad') {
                hasBadCards = true;
                break;
            }
        }
        if (this.deck.length === 0 && !hasBadCards) {
            this.won = true;
        }
        this.canRun = true;
        this.score += data.value;
        return true;
    }

    heal(card) {
        if (this.lost || this.won) return false;
        if (!this.mid.includes(card)) return false;
        if (this.mid.length === 1) return false;
        let data = card.parse();
        if (data.type !== 'life') return false;
        this.mid = this.mid.filter(c => c !== card);
        if (this.health + parseInt(data.value) > 20) {
            this.health = 20
        } else {
            this.health += parseInt(data.value);
        }
        return true;
    }
    
    checkGameState() {
        if (this.health <= 0) {
            this.lost = true;
            return 'lost';
        }
        let hasBadCards = false;
        for (let card of this.mid) {
            let cardData = card.parse();
            if (cardData.type === 'bad') {
                hasBadCards = true;
                break;
            }
        }
        
        if (this.deck.length === 0 && !hasBadCards && this.mid.length === 0) {
            this.won = true;
            return 'won';
        }
        return 'playing';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const roomHolder = document.getElementById('roomHolder');
    const weaponSlot = document.getElementById('weapon');
    const killTree = document.getElementById('killTree');
    const startBtn = document.getElementById('startBtn');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const discardWeaponBtn = document.getElementById('discardWeaponBtn');
    const enterRoomBtn = document.getElementById('enterRoomBtn');
    const restartBtn = document.getElementById('restartBtn');
    const message = document.getElementById('textBox');
    const gameOverScreen = document.getElementById('gameOver');
    const gameOverTitle = document.getElementById('gameOverScream');
    const gameOverMessage = document.getElementById('gameOverMsg');
    const deckNum = document.getElementById('deckNum');
    const health = document.getElementById('health');
    const score = document.getElementById('score');

    let game = new Game();
    let selectedCard = null;
    function update() {
        health.textContent = game.health;
        score.textContent = game.score;
        deckNum.textContent = game.deck.length;
        roomHolder.innerHTML = ''
        game.mid.forEach(x => {
            let data = x.parse();
            let el = createCardElement(x, data);
            roomHolder.appendChild(el)
        });

        if (game.weapon) {
            let wData = game.weapon.parse();
            let wEl = createCardElement(game.weapon, wData);
            weaponSlot.innerHTML = '';
            weaponSlot.appendChild(wEl);
            weaponSlot.classList.remove('cardPlace')
        } else {
            weaponSlot.innerHTML = 'Weapon';
            weaponSlot.classList.add('cardPlace')
        }

        killTree.innerHTML = '';
        game.badTree.forEach(x => {
            let data = x.parse();
            let el = createCardElement(x, data);
            killTree.appendChild(el)
        })

        runBtn.disabled = !(game.mid.length === 4 && game.canRun)
        discardWeaponBtn.disabled = !game.weapon;

        let gameState = game.checkGameState();
        if (gameState === 'lost') {
            showGameOver(false)
        } else if (gameState === 'won') {
            showGameOver(true)
        }

    }
    function createCardElement(card, data) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${data.type}`;
        cardElement.dataset.card = card;
        const suitElement = document.createElement('div');
        suitElement.className = `cardSuit suit-${data.suit}`;
        suitElement.textContent = getSuitSymbol(data.suit);
        const valueElement = document.createElement('div');
        valueElement.className = 'cardValue';
        let symbol = data.value;
        if (data.value === 13) symbol = 'K'
        if (data.value === 12) symbol = 'Q'
        if (data.value === 11) symbol = 'J'
        if (data.value === 14) symbol = 'A'
        console.log(symbol)
        valueElement.textContent = symbol;
        cardElement.appendChild(valueElement);
        cardElement.appendChild(suitElement);
        cardElement.addEventListener('click', () => handleCardClick(card));
        
        return cardElement;
    }
    function handleCardClick(card) {
        if (game.lost || game.won) return;
        let data = card.parse()
        if (data.type === 'weapon' && !game.weapon) {
            if (game.takeWeapon(card)) {
                message.textContent = `You took the ${data.value} of ${getSuitSymbol(data.suit)} as your weapon.`;
                update();
            }
        } else if (data.type === 'bad') {
            if (game.attack(card)) {
                if (game.weapon) {
                    let wData = game.weapon.parse();
                    let damage = Math.max(0, data.value - wData.value);
                    if (damage > 0) {
                        message.textContent = `You attacked the ${data.value} of ${getSuitSymbol(data.suit)} with your weapon. You took ${damage} damage.`;
                    } else {
                        message.textContent = `You attacked the ${data.value} of ${getSuitSymbol(data.suit)} with your weapon. No damage taken.`;
                    }
                } else {
                    message.textContent = `You attacked the ${data.value} of ${getSuitSymbol(data.suit)} with your bare hands. You took ${data.value} damage.`
                }
                update();
            } else if (game.badTree.length > 0) {
                let lastEnemy = game.badTree[game.badTree.length - 1].parse();
                message.textContent = `You can't attack this card! You must attack a card with a value greater than ${lastBadCard.value}.`
            } else {
                message.textContent = `You failed to attack the ${data.value} of ${getSuitSymbol(data.suit)}.`;
            }
        } else if (data.type === 'life') {
            if (game.heal(card)) {
                message.textContent = `You used the ${data.value} of ${getSuitSymbol(data.suit)} to heal ${data.value} health.`
                update()
            } else {
                message.textContent = `You failed to use the healing card.`;
            }
        }
    }
    function showGameOver(won) {
        gameOverScreen.style.display = 'flex';
        if (won) {
            gameOverScream.textContent = 'Victory!';
            gameOverMessage.textContent = 'You have defeated all the monsters and survived the dungeon!';

        } else {
            gameOverScream.textContent = 'Game Over :(';
            gameOverMessage.textContent = 'Your health reached 0. unlucky boss'
        }
    }
    startBtn.addEventListener('click', () => {
        if (game.start()) {
            message.textContent = 'Game started! Choose your actions wisely.';
            startBtn.disabled = true;
            update();
        }
    });
    discardWeaponBtn.addEventListener('click', () => {
        if (game.discardWeapon()) {
            message.textContent = 'You discarded your weapon and all attached bad cards.';
            update();
        }
    });
    runBtn.addEventListener('click', () => {
        if (game.run()) {
            message.textContent = 'You decided to run. Cards were put to the back.';
            update();
        } else {
            message.textContent = 'You cannot run right now.';
        }
    });
    
    resetBtn.addEventListener('click', () => {
        game = new Game();
        selectedCard = null;
        startBtn.disabled = false;
        gameOverScreen.style.display = 'none';
        message.textContent = 'Game reset. Click "Start Game" to begin a new adventure!';
        update();
    });

    enterRoomBtn.addEventListener('click', () => {
        if (game.enter()) {
            message.textContent = 'You entered the room.';
            update();
        } else {
            message.textContent = 'You cannot enter the room right now.';
        }
    });
    
    restartBtn.addEventListener('click', () => {
        game = new Game();
        selectedCard = null;
        startBtn.disabled = false;
        gameOverScreen.style.display = 'none';
        message.textContent = 'Game reset. Click "Start Game" to begin a new adventure!';
        update();
    });
});