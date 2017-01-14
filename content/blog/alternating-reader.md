+++
date = "2017-01-11T16:31:57-05:00"
title = "alternating reader"
description = "Alternating Attentive Reader"
draft = true
hasMath = true
hasd3 = true
js = [ "alternating" ]

+++

## Alternating Neural Attention Reader

This a blog post about machine reading models. I have implemented a modern deep neural attentive reader architecture in TensorFlow and this is a run-down of that project.

## D3
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
