// Copied onSubmit from https://stackoverflow.com/a/14472935

function findCycles() {
  // Reset output
  $("#errorLabel").text();
  $("#errorLabel").hide();
  $("#outputCyclesCount").val();
  $("#outputCycles").val();
  $("#outputMatrix").val();
  $("#outputContainer").hide();
  
  var matrix = $('#inputMatrix').val();
  var matrixRows = matrix.split('\n')

  // Validate matrix
  // - the matrix has to have at least two rows
  if (matrixRows.length < 2) {
    $("#errorLabel").text("The matrix has to have at least two rows!")
    $("#errorLabel").show();
    return;
  }

  // - the matrix has to match with the regex.
  // regex built with: https://regex101.com/
  // (note: backslash had to be double escaped, so I replaced \ with \\)
  var regex = new RegExp('^[0-9]+\\|[0-9]+(,[0-9]+)*$');
  for (index = 0; index < matrixRows.length; index++) {
    if (!regex.test(matrixRows[index])) {
      $("#errorLabel").text(`Line ${index+1}: regex test failed!`)
      $("#errorLabel").show();
      return;
    }
  }

  // Check column length
  var nrOfRows = matrixRows.length;
  for (index = 0; index < matrixRows.length; index++) {
    var columns = matrixRows[index].split('|')[1];
    var nrOfColumns = columns.split(',').length;
    if (nrOfColumns != nrOfRows) {
      $("#errorLabel").text(`Line ${index+1}: number of columns (${nrOfColumns}) doesn't match with the number of rows (${nrOfRows})!`)
      $("#errorLabel").show();
      return;
    }
  }
  
  // Transform - Parse matrix into network and assets.
  var network = [];
  var assets = [];
  if (matrixRows[0].includes('|')) {
    matrixRows.forEach(function(row, index, array) {
      var splittedRow = row.split('|');

      var assetCount = splittedRow[0];
      assets.push(assetCount);

      var nodeVertices = splittedRow[1].split(',');
      network.push(nodeVertices);
    });
  } else {
    matrixRows.forEach(function(row, index, array) {
      var nodeVertices = row.split(',');
      network.push(nodeVertices);
    });
  }

  // Post to API
  $.ajax('cycles', {
    data : JSON.stringify({network: network, assets: assets}),
    contentType : 'application/json',
    type : 'POST'
  }).done(function(data) {

    // Transform result
    var outputCycles = ""
    data.cycles.forEach(function(cycle, cycleIndex, array){
      outputCycles += cycle.join('->');
      outputCycles += '\n'
    })

    var outputMatrix = "";
    data.network.forEach(function(node, nodeIndex, array) {
      outputMatrix += data.assets[nodeIndex];
      outputMatrix += "|";
      outputMatrix += node.join(',');
      outputMatrix += '\n';
    });

    console.log(outputMatrix)

    // Show results in output container
    $("#outputCyclesCount").text(data.cycles.length);
    $("#outputCycles").val(outputCycles);
    $("#outputMatrix").val(outputMatrix);
    $("#outputContainer").show();
  })
}

$('#inputForm').submit(function (event) {
  event.stopPropagation();
  event.preventDefault();
  findCycles();
});