import string

def task():
    """
    Function to find amount of word that end on consonant, average size of word and print words with rounded to integer avg size, every 7 word and print it
    """
    text = ("So she was considering in her own mind, as well as she could, for the hot day made her feel very sleepy "
            "and stupid, whether the pleasure of making a daisy-chain would be worth the trouble of getting up and"
            " picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.")
    last = ""
    chars = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z']
    
    size = 0
    kol = 0
    text=text.strip(string.punctuation)
    words = text.split()
    
    for word in words:
        size+=len(word)
        if word[-1] in chars:
            kol+=1
    
    avg_size=round(size/len(words),0)
    print(f"Amount of words end with consonants: {kol}")
    found_words = [word for word in words if len(word) == avg_size]
    if found_words:
        print(f"Words with length {avg_size}: {found_words}")
    else:
        print(f"No words with length {avg_size}")
    
    print(f"Every 7 word: {words[6::7]}")