//gematria mapping
var gematriaTable = {"a":1, "b":2, "c":3, "d":4, "e":5, "f":6, "g":7, "h":8, "i":9, "j":10, "k":20, "l":30, "m":40, "n":50, "o":60, "p":70, "q":80, "r":90, "s":100, "t":200, "u":300, "v":400, "w":500, "x":600, "y":700, "z":800, "å":900, "ä":1000, "ö":1100};
var db = [];

//valid symbols
validSymbols = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "å", "ä", "ö"];

function getGematria(word) {
    if (word == null || word == ""){
        return 0;
    }
    var gematria = 0;
    for (var i = 0; i < word.length; i++) {
        gematria += gematriaTable[word[i]];
    }
    return gematria;
}

//read text file into db
function readDB(filename) {
    db = [];
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", filename, false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                var lines = allText.split("\n");
                for (var i = 0; i < lines.length; i++) {
                    var words = lines[i].split(" ");
                    for (var j = 0; j < words.length; j++) {
                        var word = words[j].toLowerCase();
                        var strippedWord = "";
                        for (var k = 0; k < word.length; k++) {
                            if (validSymbols.indexOf(word[k]) != -1) {
                                strippedWord += word[k];
                            }
                        }
                        db.push(strippedWord);
                    }
                }
            }
        }
    }
    rawFile.send(null);
}

function parseString(string) {
    var words = string.split(" ");
    var parsed = [];
    for (var i = 0; i < words.length; i++) {
        var word = words[i].toLowerCase();
        var newWord = "";
        for (var j = 0; j < word.length; j++) {
            if (validSymbols.indexOf(word[j]) != -1) {
                newWord += word[j];
            }
        }
        parsed.push(newWord);
    }
    return parsed.join(" ");
}

function numerologicalReduction(number) {
    //number to string
    var str = number.toString();
    //sum of digits
    var sum = 0;
    for (var i = 0; i < str.length; i++) {
        sum += parseInt(str[i]);
    }
    return sum;
}

function routeToRoot(gematria) {
    var route = [gematria];
    var current = gematria;
    while (current > 9) {
        current = numerologicalReduction(current);
        route.push(current);
    }
    return route;
}

function getWordFromDB(gematria) {
    var route = routeToRoot(gematria);
    var results = [];
    for (string of db) {
        var comparisonRoute = routeToRoot(getGematria(string));
        for(digit of route) {
            if (comparisonRoute.indexOf(digit) != -1) {
                results.push(string);
            }
        }
    }
    var returnString = results[Math.floor(Math.random() * results.length)];
    return returnString;
}

function Connection(word, weight) {
    this.word = word;
    this.weight = weight;
}

function Word(string, network) {

    this.string = string;
    this.gematria = getGematria(string);
    this.connections = [];
    this.activation = 0;
    this.target = 0;
    this.learningRate = network.learningRate;
    this.sigmoidScale = network.sigmoidScale;
    this.wordGenerationThreshold = network.wordGenerationThreshold;
    this.activationChangeFactor = network.activationChangeFactor;
    this.errorInfluenceFactor = network.errorInfluenceFactor;
    this.setWeightsByGematria = network.setWeightsByGematria;
    this.x = 0;
    this.y = 0;



    this.changeWord = function(string) {
        this.string = string;
        //calculate gematria value
        this.gematria = getGematria(string);
        //set weights
        if (this.setWeightsByGematria == true) {
            this.setWeights();
        }

    }

    this.setWeights = function(word) {
        for (var i = 0; i < this.connections.length; i++) {
            var commonGematria = this.connections[i].word.gematria + this.gematria;
            commonGematria -= commonGematria / 2;
            this.connections[i].weight = commonGematria / 1000;
        }
    }

    this.addConnection = function(word) {
        var commonGematria = this.gematria + word.gematria;
        commonGematria -= commonGematria / 2;
        var weight = commonGematria / 1000;
        this.connections.push(new Connection(word, weight));
    } 

    this.calculateActivation = function() {  
        var sum = 0;
        for (var i = 0; i < this.connections.length; i++) {
            sum += sigmoid(this.connections[i].word.activation, this.sigmoidScale) * this.connections[i].weight;
        }
        activationSign = 1;
        if (sum < 0) {
            activationSign = -1;
        }
        this.activation += this.activationChangeFactor * activationSign;

        if (this.activation > this.wordGenerationThreshold) {
            this.changeWord(getWordFromDB(this.gematria));
            this.activation = 0;
        }

        return this.activation;
    }

    this.backpropagate = function() {
        for (var i = 0; i < this.connections.length; i++) {
            var error = this.target - this.activation;
            var delta = error * this.errorInfluenceFactor;
            this.connections[i].weight += delta * this.learningRate;
        }

    }

    this.setTarget = function(target) {
        this.target = target;
    }

    this.setLearningRate = function(lr) {
        this.learningRate = lr;
    }

    this.setSigmoidScale = function(scale) {
        this.sigmoidScale = scale;
    }

    this.setWordGenerationThreshold = function(threshold) {
        this.wordGenerationThreshold = threshold*100;
    }

    this.setActivationChangeFactor = function(factor) {
        this.activationChangeFactor = factor;
    }

    this.setErrorInfluenceFactor = function(factor) {
        this.errorInfluenceFactor = factor;
    }

    this.setSetWeightsByGematria = function(bool) {
        this.setWeightsByGematria = bool;
    }
}


//sigmoid function, range 0 to 1
function sigmoid(x, scale){
    return 1 / (1 + Math.exp(-x/scale));
}


function Network() {
    this.words = [];
    this.learningRate = 0.1;
    this.sigmoidScale = 1;
    this.wordGenerationThreshold = 0.5;
    this.activationChangeFactor = 0.1;
    this.errorInfluenceFactor = 0.1;
    this.setWeightsByGematria = false;
    this.generatedSentence = "";
    this.generatedSentenceGematriaInfo = "";
    this.dbSource = "";

    this.setDBSource = function(source) {
        this.dbSource = source;
        readDB(this.dbSource);
    }

    this.clearAll = function() {
        this.words = [];
    }

    this.addHiddenLayer = function(hiddenLayer) {
        this.hiddenLayers.push(hiddenLayer);
    }

    this.addSentence = function(inwords) {
        this.words = [];
        var inputWords = inwords.split(" ");
        for (var i = 0; i < inputWords.length; i++) {
            if (inputWords[i] != "" || inputWords[i] != " "){
                this.words.push(new Word(parseString(inputWords[i]), this));
            }
        }
        for (var i = 0; i < this.words.length; i++) {
            for (var j = 0; j < this.words.length; j++) {
                if (i != j) {
                    this.words[i].addConnection(this.words[j]);
                }
            }
        }
        //place words in circle
        this.placeWordsInCircle(6);

    }

    this.setSentenceGenerationThreshold = function(threshold) {
        this.sentenceGenerationThreshold = threshold;
    }

    this.calculateActivations = function() {
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].calculateActivation();
        }
        var sum = 0;
        for (var i = 0; i < this.words.length; i++) {
            sum += this.words[i].activation;
        }
        sum /= this.words.length;
        if (sum > this.sentenceGenerationThreshold) {
            this.generateSentence();
        }
    }

    this.generateSentence = function() {
        var sentence = "";
        for (var i = 0; i < this.words.length; i++) {
            sentence += this.words[i].string + " ";
        }
        this.generatedSentence = sentence;
        //gematria data plot
        var gematriaData = "";
        var totalGematria = 0;
        for (var i = 0; i < this.words.length; i++) {
            gematriaData += routeToRoot(this.words[i].gematria) + " | ";
            totalGematria += this.words[i].gematria;
        }
        this.generatedSentenceGematriaInfo = gematriaData + " total gematria: " + routeToRoot(totalGematria);
    }


    this.backpropagate = function() {
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].backpropagate();
        }
    }

    this.update = function() {
        this.calculateActivations();
        this.backpropagate();
    }

    this.setLearningRate = function(lr) {
        this.learningRate = lr;
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].setLearningRate(lr);
        }
    }

    this.setSigmoidScale = function(scale) {
        this.sigmoidScale = scale;
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].setSigmoidScale(scale);
        }
    }

    this.setWordGenerationThreshold = function(threshold) {
        this.wordGenerationThreshold = threshold;
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].setWordGenerationThreshold(threshold);
        }
    }

    this.setActivationChangeFactor = function(factor) {
        this.activationChangeFactor = factor;
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].setActivationChangeFactor(factor);
        }
    }

    this.setErrorInfluenceFactor = function(factor) {
        this.errorInfluenceFactor = factor;
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].setErrorInfluenceFactor(factor);
        }
    }

    this.setSetWeightsByGematria = function() {
        this.setWeightsByGematria = !this.setWeightsByGematria;
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].setSetWeightsByGematria(this.setWeightsByGematria);
        }   
    }

    this.setZoom = function(zoom) {
        this.placeWordsInCircle(zoom*6);
    }

    this.setTargetActivation = function(target) {
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].setTarget(target);
        }
    }

    this.placeWordsInCircle = function(zoom) {
        var angle = 2 * Math.PI / this.words.length;
        var screenCenterX = window.innerWidth / 2;
        var screenCenterY = window.innerHeight / 2;
        var radius = 200;
        for (var i = 0; i < this.words.length; i++) {
            this.words[i].x = screenCenterX + radius * Math.cos(angle * i) * zoom;
            this.words[i].y = screenCenterY + radius * Math.sin(angle * i) * zoom;
        }
    }
}
