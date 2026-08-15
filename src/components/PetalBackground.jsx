import { useEffect, useRef } from 'react';

const PetalBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let mouse = { x: null, y: null, radius: 150 };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        window.addEventListener('mousemove', (event) => {
            mouse.x = event.x;
            mouse.y = event.y;
        });

        window.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 5 + 5; // Petal size
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 30) + 1;
                this.angle = Math.random() * 360;
                this.spinSpeed = Math.random() * 2 - 1;
                this.color = `hsla(${Math.random() * 20 + 340}, 70%, 80%, ${Math.random() * 0.4 + 0.4})`; // Pinkish/Red hues
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.angle * Math.PI) / 180);
                ctx.beginPath();
                // Draw a simple petal shape using bezier curves
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, -this.size / 2, this.size, 0);
                ctx.bezierCurveTo(this.size, this.size / 2, this.size / 2, this.size / 2, 0, 0);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
            }

            update() {
                // Mouse interaction
                if (mouse.x != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    let forceDirectionX = dx / distance;
                    let forceDirectionY = dy / distance;
                    let maxDistance = mouse.radius;
                    let force = (maxDistance - distance) / maxDistance;
                    let directionX = forceDirectionX * force * this.density;
                    let directionY = forceDirectionY * force * this.density;

                    if (distance < mouse.radius) {
                        this.x -= directionX * 5; // Push away
                        this.y -= directionY * 5;
                        this.angle += this.spinSpeed * 5; // Spin faster when pushed
                    } else {
                        // Return to original position (or just float)
                        // Let's make them float gently instead of returning strictly
                        if (this.x !== this.baseX) {
                            let dx = this.x - this.baseX;
                            this.x -= dx / 50;
                        }
                        if (this.y !== this.baseY) {
                            let dy = this.y - this.baseY;
                            this.y -= dy / 50;
                        }
                    }
                }

                // Gentle floating animation
                this.y += Math.sin(this.angle * 0.01) * 0.2;
                this.x += Math.cos(this.angle * 0.01) * 0.2;
                this.angle += this.spinSpeed * 0.5;

                // Wrap around screen
                if (this.y > canvas.height) this.y = 0;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;

                this.draw();
            }
        }

        const init = () => {
            particles = [];
            const numberOfParticles = (canvas.width * canvas.height) / 15000; // Density
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default PetalBackground;
