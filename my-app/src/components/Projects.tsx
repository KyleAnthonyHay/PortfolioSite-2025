'use client';

import Image from 'next/image';
import Link from 'next/link';

const Projects = () => {
  const projects = [
    {
      id: 1,
      title: 'Selah Note',
      image: '/projects/selah-note.png',
      link: 'https://selahnote.app',
      detailPage: '/projects/1',
    },
    {
      id: 2,
      title: 'Expense Tracker',
      image: '/projects/expense-tracker.png',
      github: 'https://github.com/KyleAnthonyHay/ExpenseTracker/tree/main/ExpenseTracker',
      detailPage: '/projects/2',
    },
    {
      id: 3,
      title: 'The Wall',
      image: '/projects/the-wall.png',
      github: 'https://github.com/KyleAnthonyHay/socialmedia-appV2.0',
      detailPage: '/projects/3',
    },
    {
      id: 4,
      title: 'OnTract',
      image: '/projects/ontract.png',
      detailPage: '/projects/5',
      landscape: true,
    },
    {
      id: 5,
      title: 'Sentio+',
      image: '/projects/sentio-1.png',
      github: 'https://github.com/KyleAnthonyHay/sentio',
      detailPage: '/projects/6',
      landscape: true,
    },
    {
      id: 6,
      title: 'ChatGPT Clone',
      image: '/projects/chatgpt-clone.png',
      link: 'https://chat-gpt-clone-delta-ten.vercel.app/',
      detailPage: '/projects/7',
      landscape: true,
    },
  ];

  return (
    <section className="pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            if (project.detailPage) {
              return (
                <Link
                  key={project.id}
                  href={project.detailPage}
                  className="group relative bg-[#F5F5F5] rounded-[20px] overflow-hidden aspect-[6/4]"
                >
                  <div className={`absolute inset-0 flex justify-center ${project.landscape ? 'items-center' : 'items-start pt-16'}`}>
                    <div className={`relative transform transition-transform duration-800 ${project.landscape ? 'w-[75%] aspect-[16/9] group-hover:scale-105' : 'w-[45%] aspect-[9/19] group-hover:-translate-y-3'}`}>
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                </Link>
              );
            }
            
            const href = project.link || project.github || '#';
            const hasLink = project.link || project.github;
            return (
              <a
                key={project.id}
                href={href}
                target={hasLink ? '_blank' : undefined}
                rel={hasLink ? 'noopener noreferrer' : undefined}
                className="group relative bg-[#F5F5F5] rounded-[20px] overflow-hidden aspect-[6/4]"
              >
                <div className={`absolute inset-0 flex justify-center ${project.landscape ? 'items-center' : 'items-start pt-16'}`}>
                  <div className={`relative transform transition-transform duration-800 ${project.landscape ? 'w-[75%] aspect-[16/9] group-hover:scale-105' : 'w-[45%] aspect-[9/19] group-hover:-translate-y-3'}`}>
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={project.id <= 2}
                    />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects; 