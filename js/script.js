    const app = angular.module('dailyTrackerApp', []);

    app.controller('TrackerController', function($scope) {
      $scope.activities = JSON.parse(sessionStorage.getItem('dailyActivities')) || [];
      $scope.newActivity = { name: '', duration: null };
      $scope.chartVisible = false;
      $scope.totalDurationExceeded = false;

      const updateChart = () => {
      const ctx = document.getElementById('pieChart').getContext('2d');
      if (window.pieChartInstance) {
        window.pieChartInstance.destroy();
      }

      const totalUsed = $scope.activities.reduce((sum, a) => sum + a.duration, 0);
      const remaining = Math.max(24 - totalUsed, 0);

      const allLabels = $scope.activities.map(a => a.name);
      const allData = $scope.activities.map(a => a.duration);
      const allColors = [
        '#66fcf1', '#45a29e', '#c5c6c7', '#1f2833', '#ffb347',
        '#ff6666', '#f39c12', '#9b59b6'
      ];

      if (remaining > 0) {
        allLabels.push('Other');
        allData.push(remaining);
        allColors.push('#888888'); // gray for remaining
      }

      const totalFinal = allData.reduce((sum, val) => sum + val, 0);
      const percentages = allData.map(val => ((val / totalFinal) * 100).toFixed(1) + '%');

      window.pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: allLabels.map((label, i) => `${label} (${percentages[i]})`),
          datasets: [{
            data: allData,
            backgroundColor: allColors
          }]
        },
        options: {
          plugins: {
            legend: {
              labels: { color: '#fff' }
            }
          }
        }
      });
    };


      function saveActivities() {
        sessionStorage.setItem('dailyActivities', JSON.stringify($scope.activities));
      }

      function checkTotalDuration() {
        const total = $scope.activities.reduce((sum, a) => sum + a.duration, 0);
        $scope.totalDurationExceeded = total > 24;
        return !$scope.totalDurationExceeded;
      }

      $scope.addActivity = function() {
        if (!$scope.newActivity.name || !$scope.newActivity.duration) return;
        $scope.activities.push({...$scope.newActivity});
        if (checkTotalDuration()) {
          saveActivities();
          $scope.newActivity = { name: '', duration: null };
        } else {
          $scope.activities.pop();
        }
      };

      $scope.deleteActivity = function(index) {
        $scope.activities.splice(index, 1);
        saveActivities();
        if ($scope.chartVisible) updateChart();
      };

      $scope.generateChart = function() {
        saveActivities();
        $scope.chartVisible = true;
        setTimeout(updateChart, 100);
      };

     $scope.downloadPDF = function() {
        const canvas = document.getElementById('pieChart');
        const image = canvas.toDataURL('image/png', 1.0);
        const pdf = new jspdf.jsPDF();

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.setFillColor(0, 0, 0); 
        pdf.rect(0, 0, pageWidth, pageHeight, 'F'); 

        pdf.addImage(image, 'PNG', 10, 10, 180, 160);

        pdf.save('day-summary-chart.pdf');
        };

    });
