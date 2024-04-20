alert("")
        var defaultState = {
            pdf: null,
            currentPage: 1,
            zoom: 1
        }
      
        pdfjsLib.getDocument('views/reactfull.pdf').then((pdf) => {
      
            defaultState.pdf = pdf;
            render();
 
        });
 
        function render() {
            defaultState.pdf.getPage(defaultState.currentPage).then((page) => {
          
                var canvas = document.getElementById("pdf_renderer");
                var ctx = canvas.getContext('2d');
      
                var viewport = page.getViewport(defaultState.zoom);
 
                canvas.width = viewport.width;
                canvas.height = viewport.height;
          
                page.render({
                    canvasContext: ctx,
                    viewport: viewport
                });
            });
        }
 
        document.getElementById('previous').addEventListener('click', (e) => {
            if(defaultState.pdf == null || defaultState.currentPage == 1) 
              return;
            defaultState.currentPage -= 1;
            document.getElementById("current_page").value = defaultState.currentPage;
            render();
        });
 
        document.getElementById('next').addEventListener('click', (e) => {
            if(defaultState.pdf == null || defaultState.currentPage > defaultState.pdf._pdfInfo.numPages) 
               return;
            defaultState.currentPage += 1;
            document.getElementById("current_page").value = defaultState.currentPage;
            render();
        });
 

        document.getElementById('current_page').addEventListener('keypress', (e) => {
            if(defaultState.pdf == null) return;
          

            var code = (e.keyCode ? e.keyCode : e.which);
          
            if(code == 13) {
                var desiredPage = 
                document.getElementById('current_page').valueAsNumber;
                                  
                if(desiredPage >= 1 && desiredPage <= defaultState.pdf._pdfInfo.numPages) {
                    defaultState.currentPage = desiredPage;
                    document.getElementById("current_page").value = desiredPage;
                    render();
                }
            }
        });
 
        document.getElementById('zoom_in').addEventListener('click', (e) => {
            if(defaultState.pdf == null) return;
            defaultState.zoom += 0.5;
            render();
        });
 
        document.getElementById('zoom_out').addEventListener('click', (e) => {
            if(defaultState.pdf == null) return;
            defaultState.zoom -= 0.5;
            render();
        });