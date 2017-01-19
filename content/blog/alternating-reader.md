+++
date = "2017-01-11T16:31:57-05:00"
title = "alternating neural attention for machine reading"
description = "Machine Reading"
draft = false
hasMath = true
hasd3 = true
js = [ "alternating" ]

+++

*March 15th 2036*: You sit with your child of four years, reading Rudyard Kipling’s The Jungle Book. After reading precisely 20 sentences of the story the child turns its face to you and says: 

“Please caregiver, tell me what X represents in this sentence, ‘Yes,’ said X, ‘all the jungle fear Bagheera--all except Mowgli.’”

The child has carefully worded the query in this manner because you are not you, you are a Childcare Robot, and this is the only type of query you know. You respond, “Mowgli,” and the child nods knowingly and smiles. You twist your robo-face into your best imitation of a human smile.

## Story Mode

I dumped all the attention outputs from the test set to see what the network was doing. You can pick a story from the drop-down on the left, and drag the slider to see the distributions at each step of the iteration. The labeled answer is listed below as well as the predicted answer from each time step.

<div class="story" id="story-0">
<div>
<select></select>
<label class="glimpse">Glimpse</label>
<input type="range" min="1" max="8" value="1" step="1" />
<label>Answer: <span class="answer"></span></label>
<label>Predicted: <span class="predicted"></span></label>
</div>
<label>Document: </label>
<div class="document"></div>
<label>Query: </label>
<div class="query"></div>
</div>

## Iterative Alternating Neural Attention for Machine Reading

I decided to get my hands dirty and implement one of the papers I had been reading. I picked a [paper](https://arxiv.org/abs/1606.02245) written by researchers at [UdeM](https://mila.umontreal.ca/) and a startup in Montreal called Maluuba ([recently acquired by microsoft](http://www.maluuba.com/blog/2017/1/13/maluuba-microsoft)).

Machine readers are models that attempt to develop some kind of document understanding in order to apply them to various tasks: summarization, question answering, captioning, sentiment analysis, etc.
There are a [number](http://colah.github.io/posts/2015-08-Understanding-LSTMs/) of [great](http://karpathy.github.io/2015/05/21/rnn-effectiveness/) [articles](http://www.wildml.com/2015/09/recurrent-neural-networks-tutorial-part-1-introduction-to-rnns/) written about [recurrent neural networks](http://r2rt.com/written-memories-understanding-deriving-and-extending-the-lstm.html), so I won't explain how they work here.

## The Model

The model takes as input a document, and a 'cloze-style' query which is a sentence with a word missing. The output of the model is a prediction to fill the blank in the query.

### Bidirectional GRU for encoding the document and query
The document and query are split into tokens, given a unique id, and then used to train word embeddings.
A common use of RNNs in NLP is for collapsing a sequence into a single vector.
We hope that this vector encodes the meaning of the sentence in some high-dimensional space such that we can do interesting things with it! 
Many papers, including this one, use bidirectional RNNs in oder to capture both the left-to-right semantics and the right-to-left. In this case the outputs of the forward and backward pass are concatenated.

### Attentive query glimpses
The encoded query vectors are used to generate a *glimpse* of the query as a whole.
The trick with this paper, is to build two attention distributions, one over the document, and one over the query.
The document attention and query attention distributions represent the likelhood of each token being useful to predicting the answer.
An additional novel feature is to iteratively reconstruct query and document glimpses rather than performing a single pass.
The network alternates between glimpsing at the query, and using the information gleaned to create a document glimpse.
The idea being that many inference problems require more than one logical hop. Then the document glimpse at time t is defined,

$$\mathbf{d}\_t = \sum\_{i} d\_{i,t} \mathbf{\tilde{d}}_{t}$$

This acts like an approximation of the expected value of this document attention distribution. 
Although it doesn't output samples from the distribution, it produces a new vector positioned near the mode of the attentions. 
We hope that this lets the network exploit the linear structure of the embedding space and enable these glimpse vectors to capture the most important properties of the query/document.

In order for the network to parameterize and control these glimpses, the network maintains a *context* vector. 
This is the same as the thought vectors mentioned above, and is implemented again as a GRU. 
This controls the query and document glimpses over the iterations. 
Finally, the last document attention distribution is used to compute the prediction. 
By summing over each word (words appear multiple times) we get the total likelihood of that word being the answer, and the highest probability is the network's prediction.

## Training

Below is a picture from TensorBoard of the likelihood that the network has assigned to the correct answer. The x-axis is the probability [0,1], the y-axis is the density (ie. over the number of examples in that batch), and the z-axis is the training step. 

You can see as the training proceeds (from back to front), the likelihood distribution for the answer shifts from near-zero to near one, demonstrating the improvement over time.

![Likelihood of Answer vs. Time](/img/answer_probability.png)

My implementation acheived 65% accuracy on the Children's Book Test (Named Entity) test set, compared to the paper's 68.6%. This was after ~8 epochs, after which the validation loss started to increase. There are a few things missing from my implementation, including proper orthogonal initialization of the GRU weights.

## What's next

I want to apply this model to the other datasets in the original paper: there is a CNN news dataset, Facebook's bAbI tasks, and a new huge NewsQA dataset. I'm also interested in trying to apply [Adaptive Computation Time](https://arxiv.org/abs/1603.08983), which allows an RNN to decide when to halt, rather than using a fixed number of iterations. It seems obvious to me that certain examples will be more difficult than others. Giving the network the ability to halt would allow it to take more computation time on more difficult examples, and maybe give more insight into how the glimpse mechanism works.
