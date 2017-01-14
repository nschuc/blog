var story_ids = [];
for(var i = 0; i < 2465; i += 32) {
  story_ids.push(i);
}
var select = d3.select('.story')
  .select('select');

select.on('change', function(d) {
  var value = d3.select(this).property("value");
  loadStory(value);
});

  select.selectAll('option')
  .data(story_ids)
  .enter()
  .append('option')
  .attr('value', function(d){ return 'story-' + d; })
  .text(function(d) { return "Story " + (d/32 + 1); });

  loadStory('story-0');

function loadStory(story_id) { // For each story instance in article
  d3.json(story_id + ".json", function(data) {
    var story = d3.select('.story');
    var answer = story.select('.answer')
      .text(data.answer);
    var glimpseLabel = story.select('.glimpse');

    var slider = story.select('input')
      .property('value', 1)
      .on('input', function() {
        glimpseNum = this.value;
        update(this.value);
      });

    update(1);

    function update(glimpseNum) {
      var t = d3.transition()
        .duration(150);

      var glimpseLabel = story.select('.glimpse').text('Glimpse: ' + glimpseNum);
      var words = {};
      for(var i = 0; i < data.doc_attentions[0].length; i++) {
        if(words[data.doc[i]] === undefined) {
          words[data.doc[i]] = 0;
        }
        words[data.doc[i]] += parseFloat(data.doc_attentions[glimpseNum - 1][i]);
      }

      var predicted = Object.keys(words).reduce(function(a, b) { return words[a] > words[b] ? a : b })
      story.select('.predicted')
        .text(predicted);

      var doc = story.select('.document')
        .selectAll('span')
        .data(d3.zip(data.doc, data.doc_attentions[glimpseNum-1]), function(d) {
          return d;
        });

      var query = story.select('.query')
        .selectAll('span')
        .data(d3.zip(data.query, data.query_attentions[glimpseNum-1]), function(d) {
          return d;
        });


      // Remove
      doc.exit().remove();

      query.exit().remove();

      /*
      var docColorScale = d3.scaleLinear()
        .domain([0, d3.max(data.doc_attentions[glimpseNum-1], function(d) { return d; })])
        //.domain([0, 0.5])
        .range([0, 1]);
        */

      var docColorScale = d3.scaleSequential(d3.interpolateGreens)
        .domain([0, d3.max(data.doc_attentions[glimpseNum-1], function(d) { return d; })]);
      var queryColorScale = d3.scaleSequential(d3.interpolateOranges)
        .domain([0, d3.max(data.query_attentions[glimpseNum-1], function(d) { return d; })]);
      // Insert
      doc.enter()
        .append('span')
        .text(function(d) { return d[0] + " "; })
        .style("background-color", function(d) { return docColorScale(d[1]); })
        .style("color", function(d) { return d3.hsl(docColorScale(d[1])).l > .5 ? 'black': 'white'; })

        query.enter()
        .append('span')
        .text(function(d) { return d[0] + " "; })
        .style("background-color", function(d) { return queryColorScale(d[1]); })
        .style("color", function(d) { return d3.hsl(queryColorScale(d[1])).l > .5 ? 'black': 'white'; })
    }
  });
}
