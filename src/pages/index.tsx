import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import { FiCalendar,FiUser } from "react-icons/fi";

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';
import  Head  from 'next/head';
import Link from 'next/link'
import { useEffect, useState } from 'react';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string; 
  result: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  
  const [nextPage, setNextPage] = useState(postsPagination.next_page)
  const [posts, setPosts] = useState<Post[]>(postsPagination.result)
  const [showMe, setShowMe] = useState(true)

  function handleShowMoreButton() {
    fetch(nextPage).then((response) => 
    response.json().then((json) => {
      const outPutNewPosts = {
        uid: json.results[0].uid,
        first_publication_date: json.results[0].first_publication_date,
        data: {
          title: json.results[0].data.title,
          subtitle: json.results[0].data.subtitle,
          author: json.results[0].data.author,
        }
      }
      setPosts([...posts,outPutNewPosts])
      setNextPage(json.next_page)
    }));
  }

  useEffect(() => {
    if (!nextPage) {
      setShowMe(false)
    }
  }, [posts,nextPage,showMe]);
  
  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>
      
      <Header />

      <main className={styles.postsContainer}> 
        <div className={styles.postsContent}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                  <strong>{RichText.asText(post.data.title)}</strong>
                  <p>{RichText.asText(post.data.subtitle)}</p>
                  <div>
                    <FiCalendar className={styles.icons} />
                    <time>{format(
                        new Date(post.first_publication_date),
                        "d MMM y",
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <FiUser className={styles.icons} />
                    <p>{RichText.asText(post.data.author)}</p>  
                  </div>
              </a>
            </Link>
          ))}
          <button style={{display: showMe?"block":"none" }} type="button" onClick={() => handleShowMoreButton()}>Carregar mais posts</button>
        </div>
        
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ],{
    fetch: ['posts.title', 'posts.subtitle','posts.author'],
    pageSize: 1,
  });

  const result: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  });

  console.log()

  const next_page = postsResponse.next_page;
  
  return {
    props: {
      postsPagination: {
        result,
        next_page
      },
    },
    revalidate: 60*30,// 24 horas
  }
};

