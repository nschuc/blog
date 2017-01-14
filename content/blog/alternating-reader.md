+++
date = "2017-01-11T16:31:57-05:00"
title = "alternating attentive reader"
description = "Alternating Attentive Reader"
draft = false
hasMath = true
hasd3 = true
js = [ "alternating" ]

+++

*March 15th 2036*: You sit with your child of four years, reading Rudyard Kipling’s The Jungle Book. After reading precisely 20 sentences of the story the child turns its face to you and says: 

“Please caregiver, tell me what X represents in this sentence, ‘Yes,’ said X, ‘all the jungle fear Bagheera--all except Mowgli.’”

The child has carefully worded the query in this manner because you are not you, you are a Childcare Robot, and this is the only type of query you know. You respond, “Mowgli,” and the child nods knowingly and smiles. You twist your robo-face into your best imitation of a human smile.

## Iterative Alternating Neural Attention for Machine Reading

This summer I decided to get my hands dirty and implement one of the papers I had been reading. I picked a [paper](https://arxiv.org/abs/1606.02245) written by researchers at [UdeM](https://mila.umontreal.ca/) and a startup in Montreal called Maluuba ([recently acquired by microsoft](http://www.maluuba.com/blog/2017/1/13/maluuba-microsoft)).

Machine readers are models that attempt to capture the semantics of documents in order to apply them to various tasks: summarization, question answering, captioning, sentiment analysis, etc. I don't know a lot about classical NLP, and so I lack the background to talk about the field as a whole, but I do know a bit about deep neural networks and the approaches taken in this field.
There are a [number](http://colah.github.io/posts/2015-08-Understanding-LSTMs/) of [great](http://karpathy.github.io/2015/05/21/rnn-effectiveness/) [articles](http://www.wildml.com/2015/09/recurrent-neural-networks-tutorial-part-1-introduction-to-rnns/) written about [recurrent neural networks](http://r2rt.com/written-memories-understanding-deriving-and-extending-the-lstm.html), so I won't explain how they work here.
In brief, RNNs are used as a way of reducing a sequence to a high dimensional vector that somehow captures the meaning of the original sequence. Geoffrey Hinton called these 'thought vectors', in the sense that they represent a 'thought' in the context of a specific problem space. For example, a model for machine translation uses an RNN to compress the source sentence in language A to a vector H. This vector is typically the 'hidden' state of the RNN. Then the same RNN 'decodes' the vector H and outputs a token sequence in language B. More advanced networks like Google's [Neural Machine Translation](https://arxiv.org/abs/1609.08144) use separate encoder and decoder networks.

The paper I looked at uses Gated Recurrent Units (a variant of RNN) to implement an attention mechanism. Again, I won't go into detail about how they work but [here is a fantastic interactive explanation](http://distill.pub/2016/augmented-rnns/). The basic idea is that RNN learns to *attend* to certain parts of its input. This is intuitively important, in our eyes only admit a small section of sharp, focused information. We scan images and text using this attention mechanism and have learned which sections of text or images require more attention. In images, this can look like sampling (x,y) from the RNN's output and attending to those. For text, the RNN will produce a hidden state that has a high cosine similarity to the input if it thinks it is an important token, and low otherwise. 

The trick with this paper, is to build two attention distributions, one over the document, and one over the query. The document attention and query attention distributions represent the likelhood of each token being useful to predicting the answer. An additional novel feature is the use of iterated adjustment of these distributions. The network iterates between glimpsing at the query, and using the information gleaned to create a document glimpse. The idea being that many inference problems require more than one logical hop, called *glimpses* in the paper. These glimpses are the weighted sum of each encoded token and it's probabilty. That is, if the attention to token \\(i\\) at time step \\(t\\) is \\(d_{i,t}\\), then the *document glimpse* is

$$\mathbf{d}\_t = \sum\_{i} d\_{i,t} \mathbf{\tilde{d}}_{t}$$

This intuitively made sense when I first read the paper. It constructs a linear combination of all the tokens, weighted by importance. However, in a more recent paper I was reading I discovered this is known as *mean-field approximation*. It is an alternative to sampling from the distribution, with nice properties (e.g. it is differentiable).

In order for the network to parameterize and control these glimpses, the network maintains a *context* vector. This is the same as the thought vectors mentioned above, and is implemented again as a GRU. This controls the query and document glimpses over the iterations. Finally, the last document attention distribution is used to compute the prediction. By marginalizing over each word (words appear multiple times) we get the total likelihood of that word being the answer, and the highest probability is the network's prediction.

## Training

Below is a picture from TensorBoard of the likelihood that the network has assigned to the correct answer. The x-axis is the probability [0,1], the y-axis is the density (ie. over the number of examples in that batch), and the z-axis is the training step. You can see as the training proceeds (from back to front), the likelihood of the answer shifts from near-zero to near one.

![Likelihood of Answer vs. Time](/img/answer_probability.png)

## Story Explorer

I've loaded all the attention outputs from the test set to see what the network was doing. You can pick a story from the drop-down on the left, and drag the slider to see the distributions at each step of the iteration. The labeled answer is listed below as well as the predicted answer from each time step. 

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

## What's next

I want to apply this model (since it's already done) to the other datasets in the original paper: there is a CNN news dataset, Facebook's bAbI tasks, and a new huge NewsQA dataset. I'm also interested in trying to apply [Adaptive Computation Time](https://arxiv.org/abs/1603.08983), which allows an RNN to decide when to halt, rather than using a fixed number of iterations. It seems obvious to me that certain examples will be more difficult than others. Giving the network the ability to halt would allow it to take more computation time on more difficult examples, and maybe give more insight into how the glimpse mechanism actually works.
