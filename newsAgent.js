var apikey = "23f015deb1114aa6b326b2481e01b54f";

var url = `https://newsapi.org/v2/everything?q=finland&apiKey=${apikey}`;

var req = new Request(url);

//fetch words from article content as an array of strings
function getNews() {
    return fetch(req)
        .then(function (response) {
        return response.json();
        })
        .then(function (data) {
        var articles = data.articles;
        var words = [];
        for (var i = 0; i < articles.length; i++) {
            var article = articles[i];
            var content = article.content;
            if (content == null) {
                continue;
            }
            var wordsInContent = content.split(" ");
            //remove non-alphabetic characters from words
            wordsInContent = wordsInContent.map(function (word) {
                // lower case
                word = word.toLowerCase();
                // remove non-alphabetic characters
                word = word.replace(/[^a-zåäö]/g, '');
                return word;
            });
            words = words.concat(wordsInContent);
        }
        console.log(words);
        return words;
    });
}