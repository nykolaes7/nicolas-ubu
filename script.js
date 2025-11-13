document.addEventListener('DOMContentLoaded', async function() {
    // First load the content
    await loadContent();
    
    // Then initialize everything else
    initializeArchive();
    
    const links = document.querySelectorAll('.nav-link');
    const topHalf = document.querySelector('.top-half');
    const bottomHalf = document.querySelector('.bottom-half');
    const homeNav = document.querySelector('.home-nav');
    const backNav = document.querySelector('.back-nav');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            if (sectionId === 'home') {
                // Show top image and collapse bottom section for home
                topHalf.classList.remove('hidden');
                bottomHalf.classList.remove('expanded');
                homeNav.style.display = 'block';
                backNav.style.display = 'none';
            } else {
                // Hide top image and expand bottom section
                topHalf.classList.add('hidden');
                bottomHalf.classList.add('expanded');
                homeNav.style.display = 'none';
                backNav.style.display = 'block';
            }
            
            // Remove active class from all content sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the selected content section
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Add form submission handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.email.value;
            const message = this.message.value;
            
            // Here you would typically send this data to a server
            console.log('Form submitted:', { email, message });
            
            // Clear the form
            this.reset();
            alert('Thank you for your message!');
        });
    }
});

function initializeArchive() {
    const projectTitles = document.querySelectorAll('.project-title');
    const projects = document.querySelectorAll('.project-item');
    
    projectTitles.forEach((title, index) => {
        title.addEventListener('click', () => {
            const content = title.nextElementSibling;
            
            // Hide all project contents
            projects.forEach(p => {
                p.querySelector('.project-content').style.display = 'none';
            });
            
            // Show selected project
            content.style.display = 'block';
        });
    });
    
    // Handle navigation buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.project-content').style.display = 'none';
        });
    });
    
    document.querySelectorAll('.next-btn, .prev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentProject = btn.closest('.project-item');
            const isNext = btn.classList.contains('next-btn');
            const targetProject = isNext ? 
                currentProject.nextElementSibling : 
                currentProject.previousElementSibling;
            
            if (targetProject) {
                currentProject.querySelector('.project-content').style.display = 'none';
                targetProject.querySelector('.project-content').style.display = 'block';
            }
        });
    });
}

async function loadContent() {
    try {
        console.log('Attempting to load content.json');
        const response = await fetch('content.json');
        if (!response.ok) {
            throw new Error('Failed to load content.json');
        }
        const content = await response.json();
        console.log('Content loaded:', content);
        
        // Load current projects
        const currentTable = document.querySelector('.calendar-table tbody');
        console.log('Current table element:', currentTable);
        
        // Helper: parse a date string and return a comparable Date (end of range if applicable)
        const parseDateForSort = (dateStr) => {
            // Cases:
            // - "Month D, YYYY"
            // - "Month D-D2, YYYY" (use D2)
            // - "Month D, YYYY - Month D2, YYYY" (use right side)
            // - "Month YYYY" (use last day of that month)
            // - "Month D, YYYY - Month D2, YYYY" and "Month D, YYYY - Month D2, YYYY"
            const months = [
                'january','february','march','april','may','june',
                'july','august','september','october','november','december'
            ];
            const lower = dateStr.toLowerCase();
            // Range split
            if (lower.includes('-')) {
                const parts = dateStr.split('-');
                const left = parts[0].trim();
                const right = parts.slice(1).join('-').trim(); // in case multiple hyphens
                // If right contains a month name, parse directly
                const rightHasMonth = months.some(m => right.toLowerCase().includes(m));
                if (rightHasMonth) {
                    return new Date(right);
                } else {
                    // Pattern like "January 17-26, 2025" -> infer month from left
                    // Extract month from left
                    const leftMonth = months.find(m => left.toLowerCase().includes(m));
                    if (leftMonth) {
                        const monthCapitalized = leftMonth.charAt(0).toUpperCase() + leftMonth.slice(1);
                        // right likely like "26, 2025"
                        const inferred = `${monthCapitalized} ${right}`;
                        return new Date(inferred);
                    }
                }
            }
            // Month YYYY
            const monthYearMatch = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
            if (monthYearMatch) {
                const monthName = monthYearMatch[1];
                const year = parseInt(monthYearMatch[2], 10);
                const monthIndex = months.indexOf(monthName.toLowerCase());
                // last day of month: day=0 of next month
                return new Date(year, monthIndex + 1, 0);
            }
            // Fallback: let Date parse normal formats
            return new Date(dateStr);
        };
        // Helper: derive activity from event/location
        const deriveActivity = (project) => {
            const e = (project.event || '').toLowerCase();
            const l = (project.location || '').toLowerCase();
            if (e.includes('radio') || l.includes('radio')) return 'Radio';
            if (e.includes('performance')) return 'Performance';
            return 'Expo';
        };
        const sortedProjects = [...content.currentProjects].sort((a, b) => {
            return parseDateForSort(b.date) - parseDateForSort(a.date);
        });
        currentTable.innerHTML = sortedProjects.map(project => `
            <tr>
                <td>${project.date}</td>
                <td>${project.event}</td>
                <td>${project.location}</td>
                <td>${deriveActivity(project)}</td>
            </tr>
        `).join('');
        
        // Load archive projects
        const archiveList = document.querySelector('.project-list');
        console.log('Archive list element:', archiveList);
        
        archiveList.innerHTML = content.archiveProjects.map((project, index) => {
            return `
                <div class="project-item">
                    <h3 class="project-title">${project.title}</h3>
                    <div class="project-content" style="display: none;">
                        ${project.video ? `
                            <div class="project-video">
                                ${project.video}
                            </div>
                        ` : ''}
                        ${project.images ? `
                            <div class="project-images">
                                ${project.images.map(image => `
                                    <div class="project-image-container">
                                        <img src="${image.path}" alt="${image.caption}" class="project-image">
                                        <p class="image-caption">${image.caption}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${project.description ? Array.isArray(project.description) ? `
                            <div class="project-description">
                                ${project.description.map(section => `
                                    <h4>${section.title}</h4>
                                    <br>
                                    <p>${section.text}</p>
                                    <br><br>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="project-description">
                                <p>${project.description}</p>
                            </div>
                        ` : ''}
                        ${project.pdfs ? `
                            <div class="project-pdfs">
                                ${project.pdfs.map(pdf => `
                                    <a href="${pdf.path}" class="pdf-link" target="_blank">${pdf.caption}</a>
                                `).join('')}
                            </div>
                        ` : ''}
                        <div class="project-navigation">
                            <button class="nav-btn back-btn">Back to List</button>
                            <div class="project-arrows">
                                <button class="nav-btn prev-btn" ${index === 0 ? 'style="visibility: hidden"' : ''}>Previous</button>
                                <button class="nav-btn next-btn" ${index === content.archiveProjects.length - 1 ? 'style="visibility: hidden"' : ''}>Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        initializeArchive();
    } catch (error) {
        console.error('Error loading content:', error);
    }
} 
