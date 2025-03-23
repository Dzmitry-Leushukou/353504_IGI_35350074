def task():
    text = ("So she was considering in her own mind, as well as she could, for the hot day made her feel very sleepy "
            "and stupid, whether the pleasure of making a daisy-chain would be worth the trouble of getting up and"
            " picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.")
    strl = []
    last = ""
    shortest = ""
    size = 1000000000
    kol = 0
    for char in text:
        if char == ' ' or char == ',' or char == '.':
            if len(last) > 0:
                strl.append(last)
            if last.endswith('a'):
                if len(last) < size:
                    size = len(last)
                    shortest = last
            if len(last) < 7:
                kol+=1
            last = ""
        else: last += char
    
    print(f"Shortest world end with 'a': {shortest}")
    print(f"Words with length < 7: {kol}")
    print("All words:")
    strl.sort(key = lambda s: len(s), reverse=True)
    print(strl)
    return